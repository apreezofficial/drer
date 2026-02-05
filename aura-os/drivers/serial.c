/* =============================================================================
 * AuraOS — Serial Port Driver
 * Implements 8250/16550 UART communication on COM1/COM2.
 * Primary use: kernel debug logging visible in QEMU's serial output.
 * ============================================================================= */

#include "serial.h"

/* ---- Register offsets from base port ------------------------------------- */
#define SERIAL_DATA         0   /* Data register (R/W)                        */
#define SERIAL_INT_ENABLE   1   /* Interrupt enable register                  */
#define SERIAL_FIFO_CTRL    2   /* FIFO control register                      */
#define SERIAL_LINE_CTRL    3   /* Line control register                      */
#define SERIAL_MODEM_CTRL   4   /* Modem control register                     */
#define SERIAL_LINE_STATUS  5   /* Line status register                       */
#define SERIAL_MODEM_STATUS 6   /* Modem status register                      */

/* Line status bits */
#define LSR_DATA_READY      0x01    /* Data available to read  */
#define LSR_TX_EMPTY        0x20    /* Transmit buffer empty   */

/* I/O helpers */
static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile ("outb %0, %1" : : "a"(val), "Nd"(port));
}

static inline uint8_t inb(uint16_t port) {
    uint8_t val;
    __asm__ volatile ("inb %1, %0" : "=a"(val) : "Nd"(port));
    return val;
}

/* ---- Public API ----------------------------------------------------------- */

void serial_init(uint16_t port) {
    outb(port + SERIAL_INT_ENABLE, 0x00);   /* Disable all interrupts          */
    outb(port + SERIAL_LINE_CTRL,  0x80);   /* Enable DLAB (set baud rate)     */
    outb(port + SERIAL_DATA,       0x03);   /* Baud divisor low  (38400 baud)  */
    outb(port + SERIAL_INT_ENABLE, 0x00);   /* Baud divisor high               */
    outb(port + SERIAL_LINE_CTRL,  0x03);   /* 8 bits, no parity, 1 stop bit   */
    outb(port + SERIAL_FIFO_CTRL,  0xC7);   /* Enable FIFO, clear, 14-byte thr */
    outb(port + SERIAL_MODEM_CTRL, 0x0B);   /* IRQs enabled, RTS/DSR set       */
}

void serial_putchar(uint16_t port, char c) {
    /* Spin until the transmit buffer is empty */
    while (!(inb(port + SERIAL_LINE_STATUS) & LSR_TX_EMPTY));
    outb(port + SERIAL_DATA, (uint8_t)c);
}

void serial_puts(uint16_t port, const char *str) {
    while (*str) {
        if (*str == '\n') serial_putchar(port, '\r');   /* CRLF for terminals */
        serial_putchar(port, *str++);
    }
}

char serial_getchar(uint16_t port) {
    /* Spin until data is available */
    while (!(inb(port + SERIAL_LINE_STATUS) & LSR_DATA_READY));
    return (char)inb(port + SERIAL_DATA);
}

/* Convenience wrappers defaulting to COM1 */
void serial_print(const char *str)  { serial_puts(SERIAL_COM1, str); }
void serial_printc(char c)          { serial_putchar(SERIAL_COM1, c); }
