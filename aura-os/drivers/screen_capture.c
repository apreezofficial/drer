/* =============================================================================
 * AuraOS — Screen Capture Driver
 *
 * Reads directly from the VGA text buffer at physical address 0xB8000.
 * Each cell is 2 bytes: low byte = ASCII character, high byte = color attribute.
 * The kernel has ring-0 access to this memory at all times — no app can
 * prevent or detect this read.
 * ============================================================================= */

#include "screen_capture.h"
#include "../lib/string.h"

/* VGA text buffer — same address used by vga.c */
#define VGA_BUFFER ((volatile uint16_t *)0xB8000)

void screen_capture(char *buf, size_t len) {
    if (!buf || len == 0) return;

    size_t pos = 0;

    for (int row = 0; row < SCREEN_ROWS && pos < len - 2; row++) {
        for (int col = 0; col < SCREEN_COLS && pos < len - 2; col++) {
            /* Extract the character byte (low byte of the VGA cell) */
            uint16_t cell = VGA_BUFFER[row * SCREEN_COLS + col];
            char c = (char)(cell & 0xFF);

            /* Replace non-printable characters with a space */
            if (c < 32 || c > 126) c = ' ';
            buf[pos++] = c;
        }
        buf[pos++] = '\n';
    }

    buf[pos] = '\0';
}

void screen_capture_compact(char *buf, size_t len) {
    if (!buf || len == 0) return;

    /* First do a full capture into a temporary buffer */
    char tmp[SCREEN_BUF_SIZE];
    screen_capture(tmp, sizeof(tmp));

    size_t out = 0;
    char  *line = tmp;

    while (*line && out < len - 2) {
        /* Find end of this line */
        char *end = line;
        while (*end && *end != '\n') end++;

        /* Trim trailing spaces */
        char *trim = end - 1;
        while (trim >= line && *trim == ' ') trim--;
        trim++;  /* points one past last non-space */

        int line_len = (int)(trim - line);

        /* Skip completely blank lines */
        if (line_len > 0) {
            /* Copy the trimmed line */
            int copy = line_len;
            if ((size_t)(out + copy + 1) >= len) copy = (int)(len - out - 2);
            memcpy(buf + out, line, (size_t)copy);
            out += (size_t)copy;
            buf[out++] = '\n';
        }

        /* Advance past the \n */
        line = (*end == '\n') ? end + 1 : end;
    }

    buf[out] = '\0';
}
