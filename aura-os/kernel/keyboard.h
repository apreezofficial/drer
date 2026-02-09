#ifndef KEYBOARD_H
#define KEYBOARD_H

#include <stdint.h>
#include <stdbool.h>

/* =============================================================================
 * PS/2 Keyboard Driver
 * Handles IRQ1, translates scancodes to ASCII, and maintains a key buffer.
 * ============================================================================= */

#define KB_BUFFER_SIZE 256

/* Initialise the keyboard driver */
void keyboard_init(void);

/* Return true if there is a character waiting in the buffer */
bool keyboard_has_char(void);

/* Read one character from the buffer (blocks until available) */
char keyboard_getchar(void);

/* Non-blocking read — returns 0 if buffer is empty */
char keyboard_poll(void);

/* Read a line into buf (up to len-1 chars), echoes to screen, ends on Enter */
void keyboard_readline(char *buf, int len);

/*
 * Register a callback for the Win+A+O global hotkey.
 * The callback fires from inside the keyboard IRQ handler (ring 0).
 * The active application never sees the keystrokes.
 */
typedef void (*hotkey_cb_t)(void);
void keyboard_set_hotkey_cb(hotkey_cb_t cb);

#endif /* KEYBOARD_H */
