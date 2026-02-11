/* =============================================================================
 * AuraOS — Virtual Memory Manager
 * Sets up x86 paging, identity-maps the first 4MB for the kernel, and
 * provides a simple bump allocator for kernel heap allocations.
 * ============================================================================= */

#include "vmm.h"
#include "pmm.h"
#include "../../lib/string.h"
#include "../../lib/stdio.h"

/* ---- Page directory / table types ---------------------------------------- */

typedef uint32_t pde_t;     /* Page Directory Entry */
typedef uint32_t pte_t;     /* Page Table Entry     */

#define PDE_COUNT   1024
#define PTE_COUNT   1024

/* The kernel page directory — 4KB aligned */
static pde_t __attribute__((aligned(4096))) kernel_page_dir[PDE_COUNT];

/* ---- Address decomposition ----------------------------------------------- */
#define PD_INDEX(v)  (((v) >> 22) & 0x3FF)
#define PT_INDEX(v)  (((v) >> 12) & 0x3FF)
#define PAGE_ALIGN(a) (((a) + 0xFFF) & ~0xFFFu)

/* ---- Bump heap ------------------------------------------------------------ */
static uint32_t heap_ptr = 0;

/* ---- CR3 / TLB helpers ---------------------------------------------------- */
static inline void load_page_dir(uint32_t phys_addr) {
    __asm__ volatile ("mov %0, %%cr3" : : "r"(phys_addr) : "memory");
}

static inline void enable_paging(void) {
    uint32_t cr0;
    __asm__ volatile ("mov %%cr0, %0" : "=r"(cr0));
    cr0 |= 0x80000000;
    __asm__ volatile ("mov %0, %%cr0" : : "r"(cr0) : "memory");
}

static inline void tlb_flush_page(uint32_t virt) {
    __asm__ volatile ("invlpg (%0)" : : "r"(virt) : "memory");
}

/* ---- Internal helpers ----------------------------------------------------- */

/* Get (or allocate) the page table for a given virtual address */
static pte_t *get_or_create_table(uint32_t virt, uint32_t flags) {
    uint32_t pdi = PD_INDEX(virt);

    if (kernel_page_dir[pdi] & PAGE_PRESENT) {
        /* Table already exists — strip flags to get physical address */
        return (pte_t *)(uintptr_t)(kernel_page_dir[pdi] & ~0xFFFu);
    }

    /* Allocate a new page table */
    uint32_t frame = pmm_alloc_frame();
    if (!frame) return (pte_t *)0;

    pte_t *table = (pte_t *)(uintptr_t)frame;
    memset(table, 0, PMM_FRAME_SIZE);

    kernel_page_dir[pdi] = frame | PAGE_PRESENT | PAGE_WRITABLE | (flags & PAGE_USER);
    return table;
}

/* ---- Public API ----------------------------------------------------------- */

void vmm_map_page(uint32_t virt, uint32_t phys, uint32_t flags) {
    pte_t *table = get_or_create_table(virt, flags);
    if (!table) return;

    uint32_t pti = PT_INDEX(virt);
    table[pti] = (phys & ~0xFFFu) | PAGE_PRESENT | flags;
    tlb_flush_page(virt);
}

void vmm_unmap_page(uint32_t virt) {
    uint32_t pdi = PD_INDEX(virt);
    if (!(kernel_page_dir[pdi] & PAGE_PRESENT)) return;

    pte_t *table = (pte_t *)(uintptr_t)(kernel_page_dir[pdi] & ~0xFFFu);
    uint32_t pti = PT_INDEX(virt);
    table[pti] = 0;
    tlb_flush_page(virt);
}

uint32_t vmm_get_physical(uint32_t virt) {
    uint32_t pdi = PD_INDEX(virt);
    if (!(kernel_page_dir[pdi] & PAGE_PRESENT)) return 0;

    pte_t *table = (pte_t *)(uintptr_t)(kernel_page_dir[pdi] & ~0xFFFu);
    uint32_t pti = PT_INDEX(virt);
    if (!(table[pti] & PAGE_PRESENT)) return 0;

    return (table[pti] & ~0xFFFu) | (virt & 0xFFF);
}

void vmm_init(void) {
    memset(kernel_page_dir, 0, sizeof(kernel_page_dir));

    /* Identity-map the first 8MB (kernel + early heap) */
    for (uint32_t addr = 0; addr < 0x800000; addr += PMM_FRAME_SIZE) {
        vmm_map_page(addr, addr, PAGE_PRESENT | PAGE_WRITABLE);
    }

    /* Initialise the heap pointer just above the identity-mapped region */
    heap_ptr = 0x800000;

    /* Load the page directory and enable paging */
    load_page_dir((uint32_t)(uintptr_t)kernel_page_dir);
    enable_paging();

    kprintf("[VMM] Paging enabled. Kernel identity-mapped (0x0 - 0x800000).\n");
}

/* ---- Bump allocator ------------------------------------------------------- */

void *kmalloc(size_t size) {
    if (!size) return (void *)0;

    /* 8-byte alignment for all allocations */
    heap_ptr = (heap_ptr + 7) & ~7u;

    uint32_t addr = heap_ptr;
    heap_ptr += (uint32_t)size;

    /* Map new pages as needed */
    uint32_t page = addr & ~0xFFFu;
    uint32_t end  = (heap_ptr + 0xFFF) & ~0xFFFu;
    while (page < end) {
        if (!vmm_get_physical(page)) {
            uint32_t frame = pmm_alloc_frame();
            if (frame) vmm_map_page(page, frame, PAGE_PRESENT | PAGE_WRITABLE);
        }
        page += PMM_FRAME_SIZE;
    }

    return (void *)(uintptr_t)addr;
}

void *kmalloc_aligned(size_t size) {
    /* Align heap pointer to page boundary first */
    heap_ptr = PAGE_ALIGN(heap_ptr);
    return kmalloc(size);
}

void kfree(void *ptr) {
    /* Bump allocator — freeing is a no-op until we implement a proper heap */
    (void)ptr;
}
