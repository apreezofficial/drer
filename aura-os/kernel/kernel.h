#ifndef KERNEL_H
#define KERNEL_H

#include <stdint.h>
#include "../kernel/memory/pmm.h"

/* =============================================================================
 * AuraOS Kernel Entry Point
 * kernel_main is called by the bootloader with the multiboot magic + info ptr.
 * ============================================================================= */

/* Multiboot magic value GRUB passes in EAX */
#define MULTIBOOT_MAGIC 0x2BADB002

void kernel_main(uint32_t magic, multiboot_info_t *mbi);

/* Kernel panic — print message and halt */
void kernel_panic(const char *msg);

#endif /* KERNEL_H */
