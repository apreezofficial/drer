/* =============================================================================
 * AuraOS — String Library
 * Freestanding implementations of standard C string/memory functions.
 * ============================================================================= */

#include "string.h"

/* ---- Memory --------------------------------------------------------------- */

void *memset(void *dst, int c, size_t n) {
    uint8_t *p = (uint8_t *)dst;
    while (n--) *p++ = (uint8_t)c;
    return dst;
}

void *memcpy(void *dst, const void *src, size_t n) {
    uint8_t       *d = (uint8_t *)dst;
    const uint8_t *s = (const uint8_t *)src;
    while (n--) *d++ = *s++;
    return dst;
}

void *memmove(void *dst, const void *src, size_t n) {
    uint8_t       *d = (uint8_t *)dst;
    const uint8_t *s = (const uint8_t *)src;
    if (d < s) {
        while (n--) *d++ = *s++;
    } else {
        d += n; s += n;
        while (n--) *--d = *--s;
    }
    return dst;
}

int memcmp(const void *a, const void *b, size_t n) {
    const uint8_t *pa = (const uint8_t *)a;
    const uint8_t *pb = (const uint8_t *)b;
    while (n--) {
        if (*pa != *pb) return (int)*pa - (int)*pb;
        pa++; pb++;
    }
    return 0;
}

/* ---- Strings -------------------------------------------------------------- */

size_t strlen(const char *s) {
    size_t len = 0;
    while (*s++) len++;
    return len;
}

char *strcpy(char *dst, const char *src) {
    char *ret = dst;
    while ((*dst++ = *src++));
    return ret;
}

char *strncpy(char *dst, const char *src, size_t n) {
    char *ret = dst;
    while (n && (*dst++ = *src++)) n--;
    while (n--) *dst++ = '\0';
    return ret;
}

char *strcat(char *dst, const char *src) {
    char *ret = dst;
    while (*dst) dst++;
    while ((*dst++ = *src++));
    return ret;
}

char *strncat(char *dst, const char *src, size_t n) {
    char *ret = dst;
    while (*dst) dst++;
    while (n-- && (*dst++ = *src++));
    *dst = '\0';
    return ret;
}

int strcmp(const char *a, const char *b) {
    while (*a && (*a == *b)) { a++; b++; }
    return (int)(uint8_t)*a - (int)(uint8_t)*b;
}

int strncmp(const char *a, const char *b, size_t n) {
    while (n && *a && (*a == *b)) { a++; b++; n--; }
    if (!n) return 0;
    return (int)(uint8_t)*a - (int)(uint8_t)*b;
}

char *strchr(const char *s, int c) {
    while (*s) {
        if (*s == (char)c) return (char *)s;
        s++;
    }
    return (c == '\0') ? (char *)s : (char *)0;
}

char *strrchr(const char *s, int c) {
    const char *last = (char *)0;
    while (*s) {
        if (*s == (char)c) last = s;
        s++;
    }
    if (c == '\0') return (char *)s;
    return (char *)last;
}

char *strstr(const char *haystack, const char *needle) {
    if (!*needle) return (char *)haystack;
    size_t nlen = strlen(needle);
    while (*haystack) {
        if (strncmp(haystack, needle, nlen) == 0)
            return (char *)haystack;
        haystack++;
    }
    return (char *)0;
}

/* ---- Conversion ----------------------------------------------------------- */

void itoa(int value, char *buf, int base) {
    char tmp[32];
    int  i = 0;
    int  neg = 0;

    if (value == 0) { buf[0] = '0'; buf[1] = '\0'; return; }

    if (value < 0 && base == 10) { neg = 1; value = -value; }

    unsigned int uval = (unsigned int)value;
    while (uval) {
        int rem = (int)(uval % (unsigned int)base);
        tmp[i++] = (char)(rem < 10 ? '0' + rem : 'a' + rem - 10);
        uval /= (unsigned int)base;
    }
    if (neg) tmp[i++] = '-';

    int j = 0;
    while (i--) buf[j++] = tmp[i];
    buf[j] = '\0';
}

void utoa(unsigned int value, char *buf, int base) {
    char tmp[32];
    int  i = 0;

    if (value == 0) { buf[0] = '0'; buf[1] = '\0'; return; }

    while (value) {
        int rem = (int)(value % (unsigned int)base);
        tmp[i++] = (char)(rem < 10 ? '0' + rem : 'a' + rem - 10);
        value /= (unsigned int)base;
    }

    int j = 0;
    while (i--) buf[j++] = tmp[i];
    buf[j] = '\0';
}

int atoi(const char *s) {
    int result = 0;
    int sign   = 1;
    while (*s == ' ' || *s == '\t') s++;
    if (*s == '-') { sign = -1; s++; }
    else if (*s == '+') s++;
    while (*s >= '0' && *s <= '9') {
        result = result * 10 + (*s - '0');
        s++;
    }
    return sign * result;
}
