#ifndef GDT_H
#define GDT_H

#include <stdint.h>

/* =============================================================================
 * Global Descriptor Table (GDT)
 * Sets up the five standard segments for protected-mode operation:
 *   0 — Null descriptor
 *   1 — Kernel code  (ring 0, execute/read)
 *   2 — Kernel data  (ring 0, read/write)
 *   3 — User code    (ring 3, execute/read)
 *   4 — User data    (ring 3, read/write)
 * ============================================================================= */

/* Segment selector indices (byte offset into GDT) */
#define GDT_KERNEL_CODE  0x08
#define GDT_KERNEL_DATA  0x10
#define GDT_USER_CODE    0x18
#define GDT_USER_DATA    0x20

/* Packed GDT entry (8 bytes) */
typedef struct __attribute__((packed)) {
    uint16_t limit_low;     /* Bits  0-15 of segment limit  */
    uint16_t base_low;      /* Bits  0-15 of base address   */
    uint8_t  base_mid;      /* Bits 16-23 of base address   */
    uint8_t  access;        /* Access byte (type + DPL)     */
    uint8_t  granularity;   /* Flags + bits 16-19 of limit  */
    uint8_t  base_high;     /* Bits 24-31 of base address   */
} gdt_entry_t;

/* GDT pointer loaded with lgdt */
typedef struct __attribute__((packed)) {
    uint16_t limit;         /* Size of GDT - 1              */
    uint32_t base;          /* Linear address of GDT        */
} gdt_ptr_t;

/* Initialise and load the GDT */
void gdt_init(void);

/* Assembly stub — flushes segment registers after lgdt */
extern void gdt_flush(uint32_t gdt_ptr);

#endif /* GDT_H */
