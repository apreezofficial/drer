/* =============================================================================
 * AuraOS — ISR / IRQ C Handlers
 * Handles CPU exceptions (panic) and dispatches hardware IRQs to registered
 * driver callbacks. Also remaps the PIC so IRQs don't conflict with exceptions.
 * ============================================================================= */

#include "isr.h"
#include "../lib/stdio.h"
#include "../drivers/vga.h"
#include "../drivers/serial.h"

/* ---- PIC constants -------------------------------------------------------- */
#define PIC1_CMD    0x20
#define PIC1_DATA   0x21
#define PIC2_CMD    0xA0
#define PIC2_DATA   0xA1
#define PIC_EOI     0x20    /* End-of-interrupt command */

static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile ("outb %0, %1" : : "a"(val), "Nd"(port));
}
static inline uint8_t inb(uint16_t port) {
    uint8_t val;
    __asm__ volatile ("inb %1, %0" : "=a"(val) : "Nd"(port));
    return val;
}

/* ---- Exception names ------------------------------------------------------ */
const char *exception_names[32] = {
    "Division By Zero",         "Debug",
    "Non-Maskable Interrupt",   "Breakpoint",
    "Overflow",                 "Bound Range Exceeded",
    "Invalid Opcode",           "Device Not Available",
    "Double Fault",             "Coprocessor Segment Overrun",
    "Invalid TSS",              "Segment Not Present",
    "Stack-Segment Fault",      "General Protection Fault",
    "Page Fault",               "Reserved",
    "x87 FPU Error",            "Alignment Check",
    "Machine Check",            "SIMD Floating-Point",
    "Virtualization",           "Reserved",
    "Reserved",                 "Reserved",
    "Reserved",                 "Reserved",
    "Reserved",                 "Reserved",
    "Reserved",                 "Reserved",
    "Security Exception",       "Reserved"
};

/* ---- IRQ handler table ---------------------------------------------------- */
static isr_handler_t irq_handlers[16];

void irq_register_handler(uint8_t irq, isr_handler_t handler) {
    if (irq < 16) irq_handlers[irq] = handler;
}

/* ---- PIC remapping -------------------------------------------------------- */
/*
 * By default the PIC maps IRQ 0-7 to INT 8-15, which conflicts with CPU
 * exceptions. We remap them to INT 32-47.
 */
static void pic_remap(void) {
    uint8_t mask1 = inb(PIC1_DATA);    /* Save masks */
    uint8_t mask2 = inb(PIC2_DATA);

    /* Start initialisation sequence (cascade mode) */
    outb(PIC1_CMD,  0x11);
    outb(PIC2_CMD,  0x11);

    /* Set vector offsets */
    outb(PIC1_DATA, 0x20);  /* Master: IRQ 0-7  → INT 32-39 */
    outb(PIC2_DATA, 0x28);  /* Slave:  IRQ 8-15 → INT 40-47 */

    /* Tell master there's a slave on IRQ2, tell slave its cascade identity */
    outb(PIC1_DATA, 0x04);
    outb(PIC2_DATA, 0x02);

    /* 8086 mode */
    outb(PIC1_DATA, 0x01);
    outb(PIC2_DATA, 0x01);

    /* Restore masks */
    outb(PIC1_DATA, mask1);
    outb(PIC2_DATA, mask2);
}

/* Called once during kernel init */
void isr_init(void) {
    pic_remap();
}

/* ---- Exception handler ---------------------------------------------------- */
void isr_handler(registers_t *regs) {
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_RED);
    kprintf("\n\n  *** KERNEL PANIC ***\n");
    kprintf("  Exception %d: %s\n", regs->int_no,
            regs->int_no < 32 ? exception_names[regs->int_no] : "Unknown");
    kprintf("  Error code: 0x%08x\n", regs->err_code);
    kprintf("  EIP: 0x%08x  CS: 0x%04x  EFLAGS: 0x%08x\n",
            regs->eip, regs->cs, regs->eflags);
    kprintf("  EAX: 0x%08x  EBX: 0x%08x  ECX: 0x%08x  EDX: 0x%08x\n",
            regs->eax, regs->ebx, regs->ecx, regs->edx);
    kprintf("  ESI: 0x%08x  EDI: 0x%08x  ESP: 0x%08x  EBP: 0x%08x\n",
            regs->esi, regs->edi, regs->esp, regs->ebp);
    kprintf("\n  System halted.\n");

    /* Halt forever */
    __asm__ volatile ("cli; hlt");
    for (;;);
}

/* ---- IRQ handler ---------------------------------------------------------- */
void irq_handler(registers_t *regs) {
    uint8_t irq = (uint8_t)(regs->int_no - 32);

    /* Dispatch to registered handler */
    if (irq < 16 && irq_handlers[irq]) {
        irq_handlers[irq](regs);
    }

    /* Send EOI to slave PIC if IRQ came from it (IRQ 8-15) */
    if (irq >= 8) outb(PIC2_CMD, PIC_EOI);

    /* Always send EOI to master PIC */
    outb(PIC1_CMD, PIC_EOI);
}
