#ifndef IDT_H
#define IDT_H

#include <stdint.h>

/* =============================================================================
 * Interrupt Descriptor Table (IDT)
 * 256 entries covering CPU exceptions (0-31) and hardware IRQs (32-47).
 * ============================================================================= */

/* Gate type flags */
#define IDT_GATE_INTERRUPT  0x8E    /* Present, ring 0, 32-bit interrupt gate */
#define IDT_GATE_TRAP       0x8F    /* Present, ring 0, 32-bit trap gate      */
#define IDT_GATE_USER       0xEE    /* Present, ring 3, 32-bit interrupt gate */

/* Packed IDT entry (8 bytes) */
typedef struct __attribute__((packed)) {
    uint16_t offset_low;    /* Bits  0-15 of handler address */
    uint16_t selector;      /* Code segment selector         */
    uint8_t  zero;          /* Always 0                      */
    uint8_t  type_attr;     /* Gate type + DPL + present bit */
    uint16_t offset_high;   /* Bits 16-31 of handler address */
} idt_entry_t;

/* IDT pointer loaded with lidt */
typedef struct __attribute__((packed)) {
    uint16_t limit;
    uint32_t base;
} idt_ptr_t;

/* Initialise and load the IDT */
void idt_init(void);

/* Set a single IDT gate */
void idt_set_gate(uint8_t num, uint32_t handler, uint16_t selector, uint8_t flags);

/* Assembly stub */
extern void idt_flush(uint32_t idt_ptr);

#endif /* IDT_H */
