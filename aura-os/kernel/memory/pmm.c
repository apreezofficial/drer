/* =============================================================================
 * AuraOS — Physical Memory Manager
 * Bitmap-based frame allocator. Each bit represents one 4KB physical frame.
 * Bit = 1 means the frame is in use; bit = 0 means it is free.
 * ============================================================================= */

#include "pmm.h"
#include "../../lib/string.h"
#include "../../lib/stdio.h"

/* ---- Bitmap storage ------------------------------------------------------- */
/* 1 bit per frame, 32 frames per uint32_t word.
 * 128 KB of bitmap covers 4 GB of physical RAM. */
#define BITMAP_WORDS (PMM_FRAMES_MAX / 32)

static uint32_t bitmap[BITMAP_WORDS];
static size_t   total_frames = 0;
static size_t   used_frames  = 0;

/* ---- Bitmap helpers ------------------------------------------------------- */

static inline void bitmap_set(uint32_t frame) {
    bitmap[frame / 32] |= (1u << (frame % 32));
}

static inline void bitmap_clear(uint32_t frame) {
    bitmap[frame / 32] &= ~(1u << (frame % 32));
}

static inline bool bitmap_test(uint32_t frame) {
    return (bitmap[frame / 32] >> (frame % 32)) & 1u;
}

/* Find the first free frame using a fast word-level scan */
static uint32_t bitmap_first_free(void) {
    for (uint32_t i = 0; i < BITMAP_WORDS; i++) {
        if (bitmap[i] == 0xFFFFFFFF) continue;   /* All used — skip */
        for (uint32_t bit = 0; bit < 32; bit++) {
            if (!((bitmap[i] >> bit) & 1u)) {
                return i * 32 + bit;
            }
        }
    }
    return (uint32_t)-1;    /* Out of memory */
}

/* ---- Public API ----------------------------------------------------------- */

void pmm_init(multiboot_info_t *mbi, uint32_t kernel_start, uint32_t kernel_end) {
    /* Start with everything marked as used */
    memset(bitmap, 0xFF, sizeof(bitmap));
    used_frames  = PMM_FRAMES_MAX;
    total_frames = 0;

    /* Walk the GRUB memory map and free available regions */
    if (!(mbi->flags & (1 << 6))) {
        kprintf("[PMM] WARNING: No memory map from bootloader!\n");
        return;
    }

    uintptr_t mmap_end = mbi->mmap_addr + mbi->mmap_length;
    mmap_entry_t *entry = (mmap_entry_t *)(uintptr_t)mbi->mmap_addr;

    while ((uintptr_t)entry < mmap_end) {
        if (entry->type == 1 && entry->base_addr < 0xFFFFFFFFULL) {
            uint32_t base = (uint32_t)entry->base_addr;
            uint32_t len  = (entry->length > 0xFFFFFFFFULL)
                            ? 0xFFFFFFFFu - base
                            : (uint32_t)entry->length;

            /* Align to frame boundaries */
            uint32_t frame_start = (base + PMM_FRAME_SIZE - 1) / PMM_FRAME_SIZE;
            uint32_t frame_end   = (base + len) / PMM_FRAME_SIZE;

            for (uint32_t f = frame_start; f < frame_end; f++) {
                if (f < PMM_FRAMES_MAX && bitmap_test(f)) {
                    bitmap_clear(f);
                    used_frames--;
                    total_frames++;
                }
            }
        }
        /* Advance to next entry (size field does not include itself) */
        entry = (mmap_entry_t *)((uintptr_t)entry + entry->size + sizeof(entry->size));
    }

    /* Re-mark the first 1MB as used (BIOS, VGA, etc.) */
    pmm_mark_used(0, 0x100000);

    /* Re-mark the kernel image as used */
    pmm_mark_used(kernel_start, kernel_end - kernel_start);

    /* Re-mark the bitmap itself as used */
    pmm_mark_used((uint32_t)(uintptr_t)bitmap, sizeof(bitmap));

    kprintf("[PMM] Total: %d MB  Used: %d KB  Free: %d MB\n",
            (total_frames * PMM_FRAME_SIZE) / (1024 * 1024),
            (used_frames  * PMM_FRAME_SIZE) / 1024,
            (pmm_free_frames() * PMM_FRAME_SIZE) / (1024 * 1024));
}

uint32_t pmm_alloc_frame(void) {
    uint32_t frame = bitmap_first_free();
    if (frame == (uint32_t)-1) return 0;    /* OOM */
    bitmap_set(frame);
    used_frames++;
    return frame * PMM_FRAME_SIZE;
}

void pmm_free_frame(uint32_t addr) {
    uint32_t frame = addr / PMM_FRAME_SIZE;
    if (frame >= PMM_FRAMES_MAX) return;
    if (!bitmap_test(frame)) return;        /* Double-free guard */
    bitmap_clear(frame);
    if (used_frames > 0) used_frames--;
}

void pmm_mark_used(uint32_t addr, size_t size) {
    uint32_t frame_start = addr / PMM_FRAME_SIZE;
    uint32_t frame_end   = (addr + size + PMM_FRAME_SIZE - 1) / PMM_FRAME_SIZE;
    for (uint32_t f = frame_start; f < frame_end && f < PMM_FRAMES_MAX; f++) {
        if (!bitmap_test(f)) {
            bitmap_set(f);
            used_frames++;
        }
    }
}

void pmm_mark_free(uint32_t addr, size_t size) {
    uint32_t frame_start = addr / PMM_FRAME_SIZE;
    uint32_t frame_end   = (addr + size) / PMM_FRAME_SIZE;
    for (uint32_t f = frame_start; f < frame_end && f < PMM_FRAMES_MAX; f++) {
        if (bitmap_test(f)) {
            bitmap_clear(f);
            if (used_frames > 0) used_frames--;
        }
    }
}

size_t pmm_total_frames(void) { return total_frames; }
size_t pmm_used_frames(void)  { return used_frames;  }
size_t pmm_free_frames(void)  {
    return total_frames > used_frames ? total_frames - used_frames : 0;
}
