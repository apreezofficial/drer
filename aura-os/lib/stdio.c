/* =============================================================================
 * AuraOS — stdio (kprintf)
 * Freestanding printf implementation. Output goes to both VGA and serial.
 * Supported specifiers: %s %d %i %u %x %X %c %p %%
 * Supported flags:      width, zero-padding (e.g. %08x)
 * ============================================================================= */

#include "stdio.h"
#include "string.h"
#include "../drivers/vga.h"
#include "../drivers/serial.h"

/* ---- Internal buffer writer ---------------------------------------------- */

typedef struct {
    char  *buf;         /* NULL = write to screen/serial, else write to buf */
    size_t pos;
    size_t limit;
} writer_t;

static void writer_putc(writer_t *w, char c) {
    if (w->buf) {
        if (w->pos + 1 < w->limit) {
            w->buf[w->pos++] = c;
        }
    } else {
        vga_putchar(c);
        serial_printc(c);
    }
}

static void writer_puts(writer_t *w, const char *s) {
    while (*s) writer_putc(w, *s++);
}

/* ---- Core formatter ------------------------------------------------------- */

static int do_printf(writer_t *w, const char *fmt, va_list args) {
    int written = 0;
    char numbuf[32];

    while (*fmt) {
        if (*fmt != '%') {
            writer_putc(w, *fmt++);
            written++;
            continue;
        }
        fmt++; /* skip '%' */

        /* Flags */
        int zero_pad = 0;
        if (*fmt == '0') { zero_pad = 1; fmt++; }

        /* Width */
        int width = 0;
        while (*fmt >= '0' && *fmt <= '9') {
            width = width * 10 + (*fmt - '0');
            fmt++;
        }

        /* Specifier */
        char spec = *fmt++;
        switch (spec) {
            case 'c': {
                char c = (char)va_arg(args, int);
                writer_putc(w, c);
                written++;
                break;
            }
            case 's': {
                const char *s = va_arg(args, const char *);
                if (!s) s = "(null)";
                int len = (int)strlen(s);
                /* Right-pad with spaces if width specified */
                for (int i = len; i < width; i++) {
                    writer_putc(w, ' '); written++;
                }
                writer_puts(w, s);
                written += len;
                break;
            }
            case 'd':
            case 'i': {
                int val = va_arg(args, int);
                itoa(val, numbuf, 10);
                int len = (int)strlen(numbuf);
                char pad = zero_pad ? '0' : ' ';
                for (int i = len; i < width; i++) {
                    writer_putc(w, pad); written++;
                }
                writer_puts(w, numbuf);
                written += len;
                break;
            }
            case 'u': {
                unsigned int val = va_arg(args, unsigned int);
                utoa(val, numbuf, 10);
                int len = (int)strlen(numbuf);
                char pad = zero_pad ? '0' : ' ';
                for (int i = len; i < width; i++) {
                    writer_putc(w, pad); written++;
                }
                writer_puts(w, numbuf);
                written += len;
                break;
            }
            case 'x': {
                unsigned int val = va_arg(args, unsigned int);
                utoa(val, numbuf, 16);
                int len = (int)strlen(numbuf);
                char pad = zero_pad ? '0' : ' ';
                for (int i = len; i < width; i++) {
                    writer_putc(w, pad); written++;
                }
                writer_puts(w, numbuf);
                written += len;
                break;
            }
            case 'X': {
                unsigned int val = va_arg(args, unsigned int);
                utoa(val, numbuf, 16);
                /* Uppercase */
                for (char *p = numbuf; *p; p++)
                    if (*p >= 'a' && *p <= 'f') *p -= 32;
                int len = (int)strlen(numbuf);
                char pad = zero_pad ? '0' : ' ';
                for (int i = len; i < width; i++) {
                    writer_putc(w, pad); written++;
                }
                writer_puts(w, numbuf);
                written += len;
                break;
            }
            case 'p': {
                /* Pointer: print as 0x0000000 */
                unsigned int val = (unsigned int)(uintptr_t)va_arg(args, void *);
                writer_puts(w, "0x");
                utoa(val, numbuf, 16);
                int len = (int)strlen(numbuf);
                for (int i = len; i < 8; i++) {
                    writer_putc(w, '0'); written++;
                }
                writer_puts(w, numbuf);
                written += len + 2;
                break;
            }
            case '%':
                writer_putc(w, '%');
                written++;
                break;
            default:
                writer_putc(w, '%');
                writer_putc(w, spec);
                written += 2;
                break;
        }
    }

    if (w->buf) w->buf[w->pos] = '\0';
    return written;
}

/* ---- Public API ----------------------------------------------------------- */

int kvprintf(const char *fmt, va_list args) {
    writer_t w = { .buf = NULL, .pos = 0, .limit = 0 };
    return do_printf(&w, fmt, args);
}

int kprintf(const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    int n = kvprintf(fmt, args);
    va_end(args);
    return n;
}

int kvsprintf(char *buf, const char *fmt, va_list args) {
    writer_t w = { .buf = buf, .pos = 0, .limit = 4096 };
    return do_printf(&w, fmt, args);
}

int ksprintf(char *buf, const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    int n = kvsprintf(buf, fmt, args);
    va_end(args);
    return n;
}
