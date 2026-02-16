/* =============================================================================
 * AuraOS — Screen AI
 *
 * Kernel-level screen analysis triggered by Win+A+O.
 *
 * How it works:
 *   1. keyboard.c intercepts Win+A+O at ring-0 (IRQ handler)
 *   2. The keystrokes are consumed — the active app sees nothing
 *   3. The full VGA buffer (0xB8000) is saved and read as plain text
 *   4. The text is sent to Groq with the user's question (or auto-analyse)
 *   5. The AI response is rendered in an overlay box at the bottom
 *   6. Any keypress dismisses the overlay and restores the screen exactly
 *
 * The active application cannot detect any of this — the kernel sits below
 * everything and owns the framebuffer unconditionally.
 *
 * Created by Precious Adedokun — https://preciousadedokun.com.ng
 * Project: https://auraos.com
 * ============================================================================= */

#include "screen_ai.h"
#include "ai_core.h"
#include "../drivers/screen_capture.h"
#include "../drivers/vga.h"
#include "../kernel/keyboard.h"
#include "../lib/string.h"
#include "../lib/stdio.h"

/* VGA buffer — same physical address used by vga.c */
#define VGA_BUFFER ((volatile uint16_t *)0xB8000)

/* ---- State ---------------------------------------------------------------- */

static uint16_t saved_screen[SCREEN_COLS * SCREEN_ROWS];
static bool     overlay_active = false;

/* Forward declaration for hotkey trampoline */
static void screen_ai_trigger_hotkey(void);

/* ---- VGA drawing helpers -------------------------------------------------- */

static inline uint8_t mk_attr(uint8_t fg, uint8_t bg) {
    return (uint8_t)((bg << 4) | (fg & 0x0F));
}
static inline uint16_t mk_cell(char c, uint8_t attr) {
    return (uint16_t)((uint16_t)attr << 8 | (uint8_t)c);
}

static void vga_hline(int row, int col, int width, char c, uint8_t attr) {
    for (int i = 0; i < width && col + i < SCREEN_COLS; i++)
        VGA_BUFFER[row * SCREEN_COLS + col + i] = mk_cell(c, attr);
}

static void vga_put(int row, int col, char c, uint8_t attr) {
    if (row < SCREEN_ROWS && col < SCREEN_COLS)
        VGA_BUFFER[row * SCREEN_COLS + col] = mk_cell(c, attr);
}

static void vga_str(int row, int col, const char *s, uint8_t attr) {
    while (*s && col < SCREEN_COLS)
        VGA_BUFFER[row * SCREEN_COLS + col++] = mk_cell(*s++, attr);
}

/* Word-wrap text into the VGA buffer. Returns next row. */
static int vga_wrap(int row, int col, int width, const char *s, uint8_t attr) {
    while (*s && row < SCREEN_ROWS) {
        /* Count chars that fit */
        int n = 0;
        while (s[n] && s[n] != '\n' && n < width) n++;

        /* Back up to last space if we hit the limit mid-word */
        if (s[n] && s[n] != '\n' && n == width) {
            int bp = n;
            while (bp > 0 && s[bp] != ' ') bp--;
            if (bp > 0) n = bp;
        }

        /* Write the line */
        for (int i = 0; i < n && col + i < SCREEN_COLS; i++)
            VGA_BUFFER[row * SCREEN_COLS + col + i] = mk_cell(s[i], attr);

        row++;
        s += n;
        if (*s == ' ' || *s == '\n') s++;
    }
    return row;
}

/* ---- Overlay renderer ----------------------------------------------------- */
/*
 * Draws a box in the bottom 9 rows of the screen:
 *
 *  Row 16: ╔══════════════════════════════════════════════════════════════════╗
 *  Row 17: ║  AuraAI  │  Win+A+O  │  340ms  │  Groq llama-3.3-70b-versatile ║
 *  Row 18: ╟──────────────────────────────────────────────────────────────────╢
 *  Row 19: ║  <response line 1>                                               ║
 *  Row 20: ║  <response line 2>                                               ║
 *  Row 21: ║  <response line 3>                                               ║
 *  Row 22: ║  <response line 4>                                               ║
 *  Row 23: ╚══════════════════════════════════════════════════════════════════╝
 *  Row 24: ║  Press any key to dismiss                                        ║
 */
static void render_overlay(const char *response, int latency_ms) {
    const int R  = 16;          /* top row of overlay  */
    const int C  = 0;           /* left col            */
    const int W  = 80;          /* full width          */
    const int BW = W - 4;       /* body text width     */

    uint8_t border = mk_attr(0xB, 0x0);   /* light cyan on black  */
    uint8_t title  = mk_attr(0xF, 0x1);   /* white on blue        */
    uint8_t body   = mk_attr(0xF, 0x0);   /* white on black       */
    uint8_t hint   = mk_attr(0xE, 0x0);   /* yellow on black      */

    /* Top border */
    vga_hline(R, C, W, '\xCD', border);
    vga_put(R, C,     '\xC9', border);
    vga_put(R, C+W-1, '\xBB', border);

    /* Title bar */
    vga_hline(R+1, C, W, ' ', title);
    char title_str[80];
    ksprintf(title_str, "  AuraAI  |  Win+A+O  |  %dms  |  Groq llama-3.3-70b-versatile",
             latency_ms);
    vga_str(R+1, C+1, title_str, title);
    vga_put(R+1, C,     '\xBA', border);
    vga_put(R+1, C+W-1, '\xBA', border);

    /* Separator */
    vga_hline(R+2, C, W, '\xC4', border);
    vga_put(R+2, C,     '\xC7', border);
    vga_put(R+2, C+W-1, '\xB6', border);

    /* Body rows (4 lines) */
    for (int r = R+3; r <= R+6; r++) {
        vga_hline(r, C, W, ' ', body);
        vga_put(r, C,     '\xBA', border);
        vga_put(r, C+W-1, '\xBA', border);
    }
    vga_wrap(R+3, C+2, BW, response, body);

    /* Bottom border */
    vga_hline(R+7, C, W, '\xCD', border);
    vga_put(R+7, C,     '\xC8', border);
    vga_put(R+7, C+W-1, '\xBC', border);

    /* Dismiss hint */
    vga_hline(R+8, C, W, ' ', hint);
    vga_str(R+8, C+2, "Press any key to dismiss  |  Win+A+O to re-trigger", hint);
}

/* ---- Public API ----------------------------------------------------------- */

void screen_ai_init(void) {
    overlay_active = false;
    /* Register the keyboard hotkey callback */
    keyboard_set_hotkey_cb((hotkey_cb_t)screen_ai_trigger_hotkey);
    kprintf("[AI]  Screen AI ready. Hotkey: Win+A+O\n");
}

/* Trampoline called from keyboard IRQ — no question, just analyse */
static void screen_ai_trigger_hotkey(void) {
    screen_ai_trigger((char *)0);
}

void screen_ai_trigger(const char *question) {
    if (overlay_active) {
        screen_ai_dismiss();
        return;
    }

    /* 1. Save the entire VGA buffer */
    for (int i = 0; i < SCREEN_COLS * SCREEN_ROWS; i++)
        saved_screen[i] = VGA_BUFFER[i];

    /* 2. Capture screen as compact text */
    char screen_text[SCREEN_BUF_SIZE];
    screen_capture_compact(screen_text, sizeof(screen_text));

    /* 3. Build the AI prompt */
    char prompt[1400];
    if (question && *question) {
        ksprintf(prompt,
            "The user is looking at this screen and asks: \"%s\"\n\n"
            "Current screen contents:\n%s\n\n"
            "Answer the question based on what is visible. "
            "Be concise — 2 sentences max.",
            question, screen_text);
    } else {
        ksprintf(prompt,
            "Analyse this screen and describe what the user is looking at "
            "in 2 sentences. Be specific about any text, errors, or notable "
            "content visible.\n\nScreen contents:\n%s",
            screen_text);
    }

    /* 4. Query Groq (or mock fallback) */
    ai_result_t result = ai_core_query(prompt);

    /* 5. Render overlay on top of the current screen */
    overlay_active = true;
    render_overlay(
        result.success ? result.response
                       : "AI query failed. Check that groq_proxy.py is running.",
        result.latency_ms
    );

    /* 6. Block until any key is pressed, then dismiss */
    keyboard_getchar();
    screen_ai_dismiss();
}

bool screen_ai_overlay_active(void) {
    return overlay_active;
}

void screen_ai_dismiss(void) {
    if (!overlay_active) return;
    /* Restore the screen pixel-perfect — the app never knew we were here */
    for (int i = 0; i < SCREEN_COLS * SCREEN_ROWS; i++)
        VGA_BUFFER[i] = saved_screen[i];
    overlay_active = false;
}
