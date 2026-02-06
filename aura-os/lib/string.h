#ifndef STRING_H
#define STRING_H

#include <stddef.h>
#include <stdint.h>

/* =============================================================================
 * AuraOS String Library
 * Freestanding implementations — no libc dependency
 * ============================================================================= */

/* Memory operations */
void  *memset (void *dst, int c, size_t n);
void  *memcpy (void *dst, const void *src, size_t n);
void  *memmove(void *dst, const void *src, size_t n);
int    memcmp (const void *a, const void *b, size_t n);

/* String operations */
size_t strlen  (const char *s);
char  *strcpy  (char *dst, const char *src);
char  *strncpy (char *dst, const char *src, size_t n);
char  *strcat  (char *dst, const char *src);
char  *strncat (char *dst, const char *src, size_t n);
int    strcmp  (const char *a, const char *b);
int    strncmp (const char *a, const char *b, size_t n);
char  *strchr  (const char *s, int c);
char  *strrchr (const char *s, int c);
char  *strstr  (const char *haystack, const char *needle);

/* Conversion */
void   itoa(int value, char *buf, int base);
void   utoa(unsigned int value, char *buf, int base);
int    atoi(const char *s);

#endif /* STRING_H */
