/* =============================================================================
 * AuraOS — PS/2 Keyboard Driver
 * Translates IRQ1 scancodes (Set 1) to ASCII characters.
 * Maintains a circular key buffer and handles shift/caps/ctrl modifiers.
 *
 * Global hotkey Win+A+O is intercepted here at ring-0 before any
 * application sees the keystrokes. Triggers the Screen AI overlay.
 * ============================================================================= */

#include "keyboard.h"
#include "isr.h"
#include "../drivers/vga.h"

/* Forward declaration — screen_ai.c registers itself via keyboard_set_hotkey_cb */
typedef void (*hotkey_cb_t)(void);
static hotkey_cb_t hotkey_callback = (hotkey_cb_t)0;

void keyboard_set_hotkey_cb(hotkey_cb_t cb) {
    hotkey_callback = cb;
}

/* PS/2 ports */
#define KB_DATA_PORT    0x60
#define KB_STATUS_PORT  0x64

static inline uint8_t inb(uint16_t port) {
    uint8_t val;
    __asm__ volatile ("inb %1, %0" : "=a"(val) : "Nd"(port));
    return val;
}

/* ---- Scancode → ASCII tables (Set 1) ------------------------------------- */

static const char sc_ascii_lower[128] = {
    0,   27,  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '\b',
    '\t','q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\n',
    0,   'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'','`',
    0,   '\\','z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 0,
    '*', 0,   ' ', 0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   '-', 0,   0,   0,   '+', 0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0
};

static const char sc_ascii_upper[128] = {
    0,   27,  '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '\b',
    '\t','Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '\n',
    0,   'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"', '~',
    0,   '|', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', 0,
    '*', 0,   ' ', 0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   '-', 0,   0,   0,   '+', 0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0
};

/* ---- Scancode constants --------------------------------------------------- */
#define SC_LSHIFT       0x2A
#define SC_RSHIFT       0x36
#define SC_LSHIFT_REL   0xAA
#define SC_RSHIFT_REL   0xB6
#define SC_CAPS         0x3A
#define SC_LCTRL        0x1D
#define SC_LCTRL_REL    0x9D

/* Win+A+O hotkey
 * Left Win key is an extended scancode: prefix E0 then 0x5B (press) / 0xDB (release)
 * A = 0x1E,  O = 0x18 */
#define SC_EXTENDED     0xE0
#define SC_LWIN         0x5B
#define SC_LWIN_REL     0xDB
#define SC_A            0x1E
#define SC_O            0x18

/* ---- Circular key buffer -------------------------------------------------- */

static volatile char kb_buf[KB_BUFFER_SIZE];
static volatile int  kb_head = 0;
static volatile int  kb_tail = 0;

/* Modifier state */
static bool shift_held   = false;
static bool caps_lock    = false;
static bool ctrl_held    = false;
static bool win_held     = false;   /* Left Windows key */
static bool extended_seq = false;   /* Next byte is extended scancode */

/* Hotkey chord tracking */
static bool hotkey_a_seen = false;
static bool hotkey_o_seen = false;

static void buf_push(char c) {
    int next = (kb_head + 1) % KB_BUFFER_SIZE;
    if (next != kb_tail) {
        kb_buf[kb_head] = c;
        kb_head = next;
    }
}

static char buf_pop(void) {
    if (kb_tail == kb_head) return 0;
    char c = kb_buf[kb_tail];
    kb_tail = (kb_tail + 1) % KB_BUFFER_SIZE;
    return c;
}

/* ---- IRQ1 handler --------------------------------------------------------- */

static void keyboard_irq_handler(registers_t *regs) {
    (void)regs;
    uint8_t sc = inb(KB_DATA_PORT);

    /* Handle extended scancode prefix (E0) */
    if (sc == SC_EXTENDED) {
        extended_seq = true;
        return;
    }

    if (extended_seq) {
        extended_seq = false;
        /* Left Windows key press / release */
        if (sc == SC_LWIN)     { win_held = true;  return; }
        if (sc == SC_LWIN_REL) {
            win_held      = false;
            hotkey_a_seen = false;
            hotkey_o_seen = false;
            return;
        }
        /* Ignore other extended keys */
        return;
    }

    /* ---- Win+A+O chord detection ----------------------------------------
     * When Win is held, we watch for A then O (in any order, both held).
     * The scancodes are consumed here — they never reach the key buffer,
     * so the active application sees nothing.
     * -------------------------------------------------------------------- */
    if (win_held) {
        if (sc == SC_A) { hotkey_a_seen = true; return; }
        if (sc == SC_O) { hotkey_o_seen = true; return; }

        /* Key-release for A or O while Win held */
        if (sc == (SC_A | 0x80)) { hotkey_a_seen = false; return; }
        if (sc == (SC_O | 0x80)) { hotkey_o_seen = false; return; }

        /* Check if full chord is complete */
        if (hotkey_a_seen && hotkey_o_seen) {
            hotkey_a_seen = false;
            hotkey_o_seen = false;
            /* Fire the registered callback (screen_ai_trigger) */
            if (hotkey_callback) hotkey_callback();
            return;
        }
        return; /* Swallow all keys while Win is held */
    }

    /* ---- Standard key handling ------------------------------------------ */

    if (sc == SC_LSHIFT || sc == SC_RSHIFT)         { shift_held = true;  return; }
    if (sc == SC_LSHIFT_REL || sc == SC_RSHIFT_REL) { shift_held = false; return; }
    if (sc == SC_CAPS)                               { caps_lock = !caps_lock; return; }
    if (sc == SC_LCTRL)                              { ctrl_held = true;  return; }
    if (sc == SC_LCTRL_REL)                          { ctrl_held = false; return; }

    /* Ignore key-release events */
    if (sc & 0x80) return;
    if (sc >= 128) return;

    bool upper = shift_held ^ caps_lock;
    char c = upper ? sc_ascii_upper[sc] : sc_ascii_lower[sc];
    if (!c) return;

    /* Ctrl+C → ETX */
    if (ctrl_held && (c == 'c' || c == 'C')) c = 0x03;

    buf_push(c);
}

/* ---- Public API ----------------------------------------------------------- */

void keyboard_init(void) {
    shift_held    = false;
    caps_lock     = false;
    ctrl_held     = false;
    win_held      = false;
    extended_seq  = false;
    hotkey_a_seen = false;
    hotkey_o_seen = false;
    kb_head       = 0;
    kb_tail       = 0;
    irq_register_handler(1, keyboard_irq_handler);
}

bool keyboard_has_char(void) {
    return kb_head != kb_tail;
}

char keyboard_getchar(void) {
    while (!keyboard_has_char()) {
        __asm__ volatile ("hlt");
    }
    return buf_pop();
}

char keyboard_poll(void) {
    return keyboard_has_char() ? buf_pop() : 0;
}

void keyboard_readline(char *buf, int len) {
    int i = 0;
    while (i < len - 1) {
        char c = keyboard_getchar();
        if (c == '\n' || c == '\r') {
            vga_putchar('\n');
            break;
        } else if (c == '\b') {
            if (i > 0) { i--; vga_putchar('\b'); }
        } else if (c == 0x03) {
            while (i > 0) { vga_putchar('\b'); i--; }
        } else if (c >= 32 && c < 127) {
            buf[i++] = c;
            vga_putchar(c);
        }
    }
    buf[i] = '\0';
}
