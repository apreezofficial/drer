#ifndef VMM_H
#define VMM_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/* =============================================================================
 * Virtual Memory Manager (VMM)
 * x86 two-level paging: page directory (1024 entries) → page tables (1024 each).
 * Each page = 4KB. Full virtual address space = 4GB.
 * ============================================================================= */

/* Page flags */
#define PAGE_PRESENT    (1 << 0)    /* Page is present in memory    */
#define PAGE_WRITABLE   (1 << 1)    /* Page is writable             */
#define PAGE_USER       (1 << 2)    /* Accessible from ring 3       */
#define PAGE_ACCESSED   (1 << 5)    /* Set by CPU on access         */
#define PAGE_DIRTY      (1 << 6)    /* Set by CPU on write          */

/* Kernel heap region */
#define KHEAP_START     0xC0000000  /* 3 GB virtual — kernel heap start */
#define KHEAP_INITIAL   0x100000    /* 1 MB initial heap size            */

/* Initialise paging — identity-maps the kernel and enables CR0.PG */
void vmm_init(void);

/* Map a virtual page to a physical frame */
void vmm_map_page(uint32_t virt, uint32_t phys, uint32_t flags);

/* Unmap a virtual page */
void vmm_unmap_page(uint32_t virt);

/* Translate a virtual address to physical (returns 0 if not mapped) */
uint32_t vmm_get_physical(uint32_t virt);

/* Simple kernel heap allocator (bump allocator) */
void *kmalloc(size_t size);
void *kmalloc_aligned(size_t size);    /* Page-aligned allocation */
void  kfree(void *ptr);                /* No-op in bump allocator — future use */

#endif /* VMM_H */
