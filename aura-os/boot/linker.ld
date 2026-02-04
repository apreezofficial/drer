/* =============================================================================
 * AuraOS Linker Script
 * Links the kernel image to load at 1MB (standard for x86 protected mode)
 * ============================================================================= */

ENTRY(_start)

SECTIONS
{
    /* Load the kernel at the 1MB mark */
    . = 1M;

    /* Executable code — multiboot header must come first */
    .text BLOCK(4K) : ALIGN(4K)
    {
        *(.multiboot)
        *(.text)
    }

    /* Read-only data (string literals, const globals) */
    .rodata BLOCK(4K) : ALIGN(4K)
    {
        *(.rodata)
    }

    /* Initialized read-write data */
    .data BLOCK(4K) : ALIGN(4K)
    {
        *(.data)
    }

    /* Uninitialized data — zeroed by the bootloader */
    .bss BLOCK(4K) : ALIGN(4K)
    {
        *(COMMON)
        *(.bss)
    }
}
