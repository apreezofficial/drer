/* =============================================================================
 * AuraOS — Kernel Entry Point
 *
 * Initialisation order:
 *   1. VGA driver          — so we can print immediately
 *   2. Serial driver       — debug output to QEMU console
 *   3. GDT                 — segment descriptors
 *   4. IDT + ISRs          — interrupt handling
 *   5. Physical MM         — frame allocator
 *   6. Virtual MM          — paging
 *   7. Timer (PIT)         — system tick @ 1000 Hz
 *   8. Keyboard            — PS/2 input
 *   9. AI core             — kernel AI subsystem
 *  10. Shell               — interactive user interface (does not return)
 * ============================================================================= */

#include "kernel.h"
#include "gdt.h"
#include "idt.h"
#include "isr.h"
#include "timer.h"
#include "keyboard.h"
#include "memory/pmm.h"
#include "memory/vmm.h"
#include "../drivers/vga.h"
#include "../drivers/serial.h"
#include "../ai/ai_core.h"
#include "../ai/screen_ai.h"
#include "../shell/shell.h"
#include "../lib/stdio.h"
#include "../lib/string.h"

/* Kernel image boundaries — provided by the linker script */
extern uint32_t _kernel_start;
extern uint32_t _kernel_end;

/* ---- Panic ---------------------------------------------------------------- */

void kernel_panic(const char *msg) {
    __asm__ volatile ("cli");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_RED);
    kprintf("\n\n  *** KERNEL PANIC ***\n  %s\n  System halted.\n", msg);
    serial_print("[PANIC] ");
    serial_print(msg);
    serial_print("\n");
    for (;;) __asm__ volatile ("hlt");
}

/* ---- Boot banner ---------------------------------------------------------- */

static void print_boot_banner(void) {
    vga_set_color(VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);
    serial_print("\n[AuraOS] Booting...\n");
    kprintf("[AuraOS] Kernel booting...\n\n");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
}

/* ---- Subsystem init with status line ------------------------------------- */

static void init_step(const char *name, void (*fn)(void)) {
    kprintf("  [ ] %s", name);
    serial_print("  Initialising: ");
    serial_print(name);
    fn();
    /* Move cursor back and print OK — simple status line */
    kprintf("\r  [");
    vga_set_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    kprintf("OK");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    kprintf("]\n");
    serial_print(" ... OK\n");
}

/* ---- kernel_main ---------------------------------------------------------- */

void kernel_main(uint32_t magic, multiboot_info_t *mbi) {
    /* 1. VGA — must be first so we can print */
    vga_init();
    print_boot_banner();

    /* 2. Serial */
    serial_init(SERIAL_COM1);
    serial_print("[AuraOS] Serial port initialised.\n");

    /* Validate multiboot magic */
    if (magic != MULTIBOOT_MAGIC) {
        kernel_panic("Invalid multiboot magic number. Was this booted by GRUB?");
    }

    kprintf("  Multiboot magic: 0x%08x  OK\n", magic);
    kprintf("  Kernel range: 0x%08x - 0x%08x\n\n",
            (uint32_t)(uintptr_t)&_kernel_start,
            (uint32_t)(uintptr_t)&_kernel_end);

    /* 3. GDT */
    init_step("GDT (Global Descriptor Table)  ", gdt_init);

    /* 4. IDT + PIC remap */
    init_step("IDT (Interrupt Descriptor Table)", idt_init);
    isr_init();     /* Remap PIC */

    /* Enable interrupts */
    __asm__ volatile ("sti");
    kprintf("  [OK] Interrupts enabled\n");

    /* 5. Physical memory manager */
    kprintf("  [ ] PMM (Physical Memory Manager)");
    pmm_init(mbi,
             (uint32_t)(uintptr_t)&_kernel_start,
             (uint32_t)(uintptr_t)&_kernel_end);
    kprintf("\r  [");
    vga_set_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    kprintf("OK");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    kprintf("]\n");

    /* 6. Virtual memory manager */
    init_step("VMM (Virtual Memory / Paging)   ", vmm_init);

    /* 7. PIT Timer @ 1000 Hz */
    kprintf("  [ ] PIT Timer (1000 Hz)             ");
    timer_init(1000);
    kprintf("\r  [");
    vga_set_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    kprintf("OK");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    kprintf("]\n");
    serial_print("  Initialising: PIT Timer ... OK\n");

    /* 8. Keyboard */
    init_step("PS/2 Keyboard driver            ", keyboard_init);

    /* 9. AI core */
    init_step("AI Core subsystem               ", ai_core_init);

    /* 10. Screen AI + Win+A+O hotkey */
    init_step("Screen AI (Win+A+O hotkey)      ", screen_ai_init);

    kprintf("\n  All subsystems online.\n\n");
    serial_print("[AuraOS] All subsystems online. Launching shell.\n");

    /* 10. Shell — does not return */
    shell_run();

    /* Should never reach here */
    kernel_panic("shell_run() returned unexpectedly.");
}
