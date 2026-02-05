#ifndef SERIAL_H
#define SERIAL_H

#include <stdint.h>

/* =============================================================================
 * Serial Port Driver (COM1)
 * Used for kernel debug output — output appears in QEMU's serial console
 * or can be piped to a file with: -serial file:serial.log
 * ============================================================================= */

#define SERIAL_COM1 0x3F8
#define SERIAL_COM2 0x2F8

/* Initialise a COM port at 38400 baud, 8N1 */
void serial_init(uint16_t port);

/* Write a single byte (blocks until FIFO is ready) */
void serial_putchar(uint16_t port, char c);

/* Write a null-terminated string */
void serial_puts(uint16_t port, const char *str);

/* Read a byte (blocks until data is available) */
char serial_getchar(uint16_t port);

/* Convenience wrappers that default to COM1 */
void serial_print(const char *str);
void serial_printc(char c);

#endif /* SERIAL_H */
