#ifndef ISR_H
#define ISR_H

#include <stdint.h>

/* =============================================================================
 * Interrupt Service Routines
 * CPU exception handlers (ISR 0-31) and hardware IRQ handlers (IRQ 0-15).
 * Assembly stubs are in isr.asm; C handlers are in isr.c.
 * ============================================================================= */

/* Register state pushed by the ISR stub before calling the C handler */
typedef struct {
    /* Pushed by pusha */
    uint32_t edi, esi, ebp, esp, ebx, edx, ecx, eax;
    /* Pushed by the stub */
    uint32_t int_no;    /* Interrupt number */
    uint32_t err_code;  /* Error code (0 if none) */
    /* Pushed automatically by the CPU */
    uint32_t eip, cs, eflags, useresp, ss;
} registers_t;

/* C-level interrupt handler type */
typedef void (*isr_handler_t)(registers_t *regs);

/* Register a C handler for a given IRQ line (0-15) */
void irq_register_handler(uint8_t irq, isr_handler_t handler);

/* Called from assembly stubs */
void isr_handler(registers_t *regs);
void irq_handler(registers_t *regs);

/* ---- Assembly stubs (defined in isr.asm) --------------------------------- */
extern void isr0(void);  extern void isr1(void);  extern void isr2(void);
extern void isr3(void);  extern void isr4(void);  extern void isr5(void);
extern void isr6(void);  extern void isr7(void);  extern void isr8(void);
extern void isr9(void);  extern void isr10(void); extern void isr11(void);
extern void isr12(void); extern void isr13(void); extern void isr14(void);
extern void isr15(void); extern void isr16(void); extern void isr17(void);
extern void isr18(void); extern void isr19(void); extern void isr20(void);
extern void isr21(void); extern void isr22(void); extern void isr23(void);
extern void isr24(void); extern void isr25(void); extern void isr26(void);
extern void isr27(void); extern void isr28(void); extern void isr29(void);
extern void isr30(void); extern void isr31(void);

extern void irq0(void);  extern void irq1(void);  extern void irq2(void);
extern void irq3(void);  extern void irq4(void);  extern void irq5(void);
extern void irq6(void);  extern void irq7(void);  extern void irq8(void);
extern void irq9(void);  extern void irq10(void); extern void irq11(void);
extern void irq12(void); extern void irq13(void); extern void irq14(void);
extern void irq15(void);

/* Exception names for pretty-printing */
extern const char *exception_names[32];

#endif /* ISR_H */
