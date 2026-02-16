#ifndef SCREEN_CAPTURE_H
#define SCREEN_CAPTURE_H

#include <stddef.h>
#include <stdint.h>

/* =============================================================================
 * AuraOS — Screen Capture Driver
 * Reads the live VGA text buffer (0xB8000) and converts it to a plain string.
 * Since the kernel owns the framebuffer, no application can hide from this.
 * ============================================================================= */

#define SCREEN_COLS     80
#define SCREEN_ROWS     25
#define SCREEN_CELLS    (SCREEN_COLS * SCREEN_ROWS)

/* Minimum buffer size for a full screen dump (cols * rows + row separators) */
#define SCREEN_BUF_SIZE (SCREEN_CELLS + SCREEN_ROWS + 1)

/*
 * Capture the current VGA text buffer into buf as a plain UTF-8 string.
 * Non-printable characters are replaced with spaces.
 * Each row is terminated with \n.
 * buf must be at least SCREEN_BUF_SIZE bytes.
 */
void screen_capture(char *buf, size_t len);

/*
 * Like screen_capture but trims trailing whitespace from each line
 * and skips fully blank lines — produces a compact representation
 * better suited for AI prompts.
 */
void screen_capture_compact(char *buf, size_t len);

#endif /* SCREEN_CAPTURE_H */
