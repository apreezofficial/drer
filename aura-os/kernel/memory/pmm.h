#ifndef PMM_H
#define PMM_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/* =============================================================================
 * Physical Memory Manager (PMM)
 * Bitmap allocator — tracks 4KB frames across the full physical address space.
 * Parses the GRUB multiboot memory map on init.
 * ============================================================================= */

#define PMM_FRAME_SIZE  4096        /* 4 KB per frame                */
#define PMM_FRAMES_MAX  (1024*1024) /* Support up to 4 GB (4B frames)*/

/* Multiboot memory map entry (as passed by GRUB) */
typedef struct __attribute__((packed)) {
    uint32_t size;
    uint64_t base_addr;
    uint64_t length;
    uint32_t type;          /* 1 = available RAM, anything else = reserved */
} mmap_entry_t;

/* Multiboot info struct (partial — only fields we use) */
typedef struct __attribute__((packed)) {
    uint32_t flags;
    uint32_t mem_lower;     /* KB of lower memory  */
    uint32_t mem_upper;     /* KB of upper memory  */
    uint32_t boot_device;
    uint32_t cmdline;
    uint32_t mods_count;
    uint32_t mods_addr;
    uint32_t syms[4];
    uint32_t mmap_length;
    uint32_t mmap_addr;
} multiboot_info_t;

/* Initialise the PMM from the multiboot memory map */
void pmm_init(multiboot_info_t *mbi, uint32_t kernel_start, uint32_t kernel_end);

/* Allocate one 4KB physical frame — returns physical address or 0 on failure */
uint32_t pmm_alloc_frame(void);

/* Free a previously allocated frame */
void pmm_free_frame(uint32_t addr);

/* Mark a range of physical memory as used */
void pmm_mark_used(uint32_t addr, size_t size);

/* Mark a range of physical memory as free */
void pmm_mark_free(uint32_t addr, size_t size);

/* Statistics */
size_t pmm_total_frames(void);
size_t pmm_used_frames(void);
size_t pmm_free_frames(void);

#endif /* PMM_H */
