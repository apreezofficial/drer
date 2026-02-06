#ifndef STDIO_H
#define STDIO_H

#include <stdarg.h>
#include <stddef.h>

/* =============================================================================
 * AuraOS stdio — freestanding printf-style output
 * Supports: %s %d %i %u %x %X %c %p %% %05d style width/padding
 * ============================================================================= */

/* Print formatted string to VGA + serial */
int kprintf(const char *fmt, ...);

/* Print formatted string into a buffer */
int ksprintf(char *buf, const char *fmt, ...);

/* va_list variants */
int kvprintf (const char *fmt, va_list args);
int kvsprintf(char *buf, const char *fmt, va_list args);

#endif /* STDIO_H */
