#ifndef VGA_H
#define VGA_H

#include <stdint.h>
#include <stddef.h>

/* =============================================================================
 * VGA Text Mode Driver
 * Provides character output to the 80x25 VGA text buffer at 0xB8000
 * ============================================================================= */

/* Standard 16-color VGA palette */
typedef enum {
    VGA_COLOR_BLACK         = 0,
    VGA_COLOR_BLUE          = 1,
    VGA_COLOR_GREEN         = 2,
    VGA_COLOR_CYAN          = 3,
    VGA_COLOR_RED           = 4,
    VGA_COLOR_MAGENTA       = 5,
    VGA_COLOR_BROWN         = 6,
    VGA_COLOR_LIGHT_GREY    = 7,
    VGA_COLOR_DARK_GREY     = 8,
    VGA_COLOR_LIGHT_BLUE    = 9,
    VGA_COLOR_LIGHT_GREEN   = 10,
    VGA_COLOR_LIGHT_CYAN    = 11,
    VGA_COLOR_LIGHT_RED     = 12,
    VGA_COLOR_LIGHT_MAGENTA = 13,
    VGA_COLOR_YELLOW        = 14,
    VGA_COLOR_WHITE         = 15,
} vga_color_t;

#define VGA_WIDTH  80
#define VGA_HEIGHT 25

/* Initialise the VGA driver and clear the screen */
void vga_init(void);

/* Clear the screen with the current background color */
void vga_clear(void);

/* Set the active foreground / background color */
void vga_set_color(vga_color_t fg, vga_color_t bg);

/* Write a single character (handles \n, \r, \t, \b) */
void vga_putchar(char c);

/* Write a null-terminated string */
void vga_puts(const char *str);

/* Move the hardware cursor to (x, y) */
void vga_set_cursor(size_t x, size_t y);

/* Scroll the screen up by one line */
void vga_scroll(void);

/* Return current cursor column */
size_t vga_get_col(void);

/* Return current cursor row */
size_t vga_get_row(void);

#endif /* VGA_H */
