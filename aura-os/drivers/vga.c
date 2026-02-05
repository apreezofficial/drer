/* =============================================================================
 * AuraOS — VGA Text Mode Driver
 * Drives the 80x25 color text buffer mapped at physical address 0xB8000.
 * Each cell is 2 bytes: [attribute][character].
 * ============================================================================= */

#include "vga.h"
#include "../lib/string.h"

/* I/O port helpers (inline to avoid a separate io.h dependency here) */
static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile ("outb %0, %1" : : "a"(val), "Nd"(port));
}

/* VGA text buffer base address */
#define VGA_BUFFER ((volatile uint16_t *)0xB8000)

/* VGA CRT controller ports */
#define VGA_CTRL_REG  0x3D4
#define VGA_DATA_REG  0x3D5
#define VGA_CURSOR_HI 0x0E
#define VGA_CURSOR_LO 0x0F

/* Driver state */
static size_t    vga_row;
static size_t    vga_col;
static uint8_t   vga_color;

/* Build a VGA attribute byte from fg + bg colors */
static inline uint8_t make_color(vga_color_t fg, vga_color_t bg) {
    return (uint8_t)((bg << 4) | (fg & 0x0F));
}

/* Build a VGA cell word from a character and attribute */
static inline uint16_t make_entry(char c, uint8_t color) {
    return (uint16_t)((uint16_t)color << 8 | (uint8_t)c);
}

/* Update the blinking hardware cursor position */
static void update_cursor(void) {
    uint16_t pos = (uint16_t)(vga_row * VGA_WIDTH + vga_col);
    outb(VGA_CTRL_REG, VGA_CURSOR_HI);
    outb(VGA_DATA_REG, (uint8_t)(pos >> 8));
    outb(VGA_CTRL_REG, VGA_CURSOR_LO);
    outb(VGA_DATA_REG, (uint8_t)(pos & 0xFF));
}

/* ---- Public API ----------------------------------------------------------- */

void vga_init(void) {
    vga_row   = 0;
    vga_col   = 0;
    vga_color = make_color(VGA_COLOR_LIGHT_GREY, VGA_COLOR_BLACK);
    vga_clear();
}

void vga_clear(void) {
    uint16_t blank = make_entry(' ', vga_color);
    for (size_t i = 0; i < VGA_WIDTH * VGA_HEIGHT; i++) {
        VGA_BUFFER[i] = blank;
    }
    vga_row = 0;
    vga_col = 0;
    update_cursor();
}

void vga_set_color(vga_color_t fg, vga_color_t bg) {
    vga_color = make_color(fg, bg);
}

void vga_scroll(void) {
    /* Move every row up by one */
    for (size_t row = 1; row < VGA_HEIGHT; row++) {
        for (size_t col = 0; col < VGA_WIDTH; col++) {
            VGA_BUFFER[(row - 1) * VGA_WIDTH + col] =
                VGA_BUFFER[row * VGA_WIDTH + col];
        }
    }
    /* Clear the last row */
    uint16_t blank = make_entry(' ', vga_color);
    for (size_t col = 0; col < VGA_WIDTH; col++) {
        VGA_BUFFER[(VGA_HEIGHT - 1) * VGA_WIDTH + col] = blank;
    }
    if (vga_row > 0) vga_row--;
}

void vga_set_cursor(size_t x, size_t y) {
    if (x < VGA_WIDTH)  vga_col = x;
    if (y < VGA_HEIGHT) vga_row = y;
    update_cursor();
}

size_t vga_get_col(void) { return vga_col; }
size_t vga_get_row(void) { return vga_row; }

void vga_putchar(char c) {
    switch (c) {
        case '\n':
            vga_col = 0;
            vga_row++;
            break;
        case '\r':
            vga_col = 0;
            break;
        case '\t':
            /* Advance to next 8-column tab stop */
            vga_col = (vga_col + 8) & ~(size_t)7;
            if (vga_col >= VGA_WIDTH) {
                vga_col = 0;
                vga_row++;
            }
            break;
        case '\b':
            if (vga_col > 0) {
                vga_col--;
                VGA_BUFFER[vga_row * VGA_WIDTH + vga_col] =
                    make_entry(' ', vga_color);
            }
            break;
        default:
            VGA_BUFFER[vga_row * VGA_WIDTH + vga_col] =
                make_entry(c, vga_color);
            vga_col++;
            if (vga_col >= VGA_WIDTH) {
                vga_col = 0;
                vga_row++;
            }
            break;
    }

    /* Scroll if we've gone past the last row */
    if (vga_row >= VGA_HEIGHT) {
        vga_scroll();
    }

    update_cursor();
}

void vga_puts(const char *str) {
    while (*str) {
        vga_putchar(*str++);
    }
}
