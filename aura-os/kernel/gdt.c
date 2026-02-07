/* =============================================================================
 * AuraOS — Global Descriptor Table
 * Configures the five standard GDT segments and loads them via lgdt.
 * ============================================================================= */

#include "gdt.h"
#include "../lib/string.h"

#define GDT_ENTRIES 5

static gdt_entry_t gdt[GDT_ENTRIES];
static gdt_ptr_t   gdt_ptr;

/* ---- Access byte flags ---------------------------------------------------- */
/*
 *  Bit 7   : Present (must be 1 for valid segment)
 *  Bits 5-6: DPL (0 = kernel, 3 = user)
 *  Bit 4   : Descriptor type (1 = code/data, 0 = system)
 *  Bit 3   : Executable (1 = code, 0 = data)
 *  Bit 2   : Direction/Conforming
 *  Bit 1   : Readable/Writable
 *  Bit 0   : Accessed (CPU sets this; we leave it 0)
 */
#define ACCESS_PRESENT    0x80
#define ACCESS_RING0      0x00
#define ACCESS_RING3      0x60
#define ACCESS_DESCRIPTOR 0x10
#define ACCESS_EXEC       0x08
#define ACCESS_RW         0x02

/* Granularity byte flags */
#define GRAN_4K           0x80  /* Limit is in 4KB pages */
#define GRAN_32BIT        0x40  /* 32-bit protected mode  */

/* ---- Helper --------------------------------------------------------------- */

static void gdt_set_entry(int idx, uint32_t base, uint32_t limit,
                           uint8_t access, uint8_t gran) {
    gdt[idx].base_low    = (uint16_t)(base & 0xFFFF);
    gdt[idx].base_mid    = (uint8_t)((base >> 16) & 0xFF);
    gdt[idx].base_high   = (uint8_t)((base >> 24) & 0xFF);
    gdt[idx].limit_low   = (uint16_t)(limit & 0xFFFF);
    gdt[idx].granularity = (uint8_t)((gran & 0xF0) | ((limit >> 16) & 0x0F));
    gdt[idx].access      = access;
}

/* ---- Public API ----------------------------------------------------------- */

void gdt_init(void) {
    gdt_ptr.limit = (uint16_t)(sizeof(gdt_entry_t) * GDT_ENTRIES - 1);
    gdt_ptr.base  = (uint32_t)&gdt;

    /* 0: Null descriptor — required by the CPU spec */
    gdt_set_entry(0, 0, 0, 0, 0);

    /* 1: Kernel code — ring 0, full 4GB, 32-bit */
    gdt_set_entry(1, 0, 0xFFFFFFFF,
        ACCESS_PRESENT | ACCESS_RING0 | ACCESS_DESCRIPTOR | ACCESS_EXEC | ACCESS_RW,
        GRAN_4K | GRAN_32BIT);

    /* 2: Kernel data — ring 0, full 4GB, 32-bit */
    gdt_set_entry(2, 0, 0xFFFFFFFF,
        ACCESS_PRESENT | ACCESS_RING0 | ACCESS_DESCRIPTOR | ACCESS_RW,
        GRAN_4K | GRAN_32BIT);

    /* 3: User code — ring 3, full 4GB, 32-bit */
    gdt_set_entry(3, 0, 0xFFFFFFFF,
        ACCESS_PRESENT | ACCESS_RING3 | ACCESS_DESCRIPTOR | ACCESS_EXEC | ACCESS_RW,
        GRAN_4K | GRAN_32BIT);

    /* 4: User data — ring 3, full 4GB, 32-bit */
    gdt_set_entry(4, 0, 0xFFFFFFFF,
        ACCESS_PRESENT | ACCESS_RING3 | ACCESS_DESCRIPTOR | ACCESS_RW,
        GRAN_4K | GRAN_32BIT);

    /* Load the GDT and flush segment registers */
    gdt_flush((uint32_t)&gdt_ptr);
}
