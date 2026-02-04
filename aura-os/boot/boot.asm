; =============================================================================
; AuraOS Bootloader
; GRUB Multiboot compliant entry point
; Sets up the stack and transfers control to the C kernel
; =============================================================================

; Multiboot header constants
MBOOT_PAGE_ALIGN    equ 1 << 0          ; Align loaded modules on page boundaries
MBOOT_MEM_INFO      equ 1 << 1          ; Provide memory map
MBOOT_MAGIC         equ 0x1BADB002      ; Multiboot magic number
MBOOT_FLAGS         equ MBOOT_PAGE_ALIGN | MBOOT_MEM_INFO
MBOOT_CHECKSUM      equ -(MBOOT_MAGIC + MBOOT_FLAGS)

; =============================================================================
; Multiboot Header — must be in the first 8KB of the kernel image
; =============================================================================
section .multiboot
align 4
    dd MBOOT_MAGIC
    dd MBOOT_FLAGS
    dd MBOOT_CHECKSUM

; =============================================================================
; BSS — uninitialized data (stack lives here)
; =============================================================================
section .bss
align 16
stack_bottom:
    resb 16384          ; 16 KiB kernel stack
stack_top:

; =============================================================================
; Text — executable code
; =============================================================================
section .text
global _start
extern kernel_main

_start:
    ; Disable interrupts until the kernel sets up the IDT
    cli

    ; Set up the kernel stack
    mov esp, stack_top

    ; GRUB passes two values we need to forward to the kernel:
    ;   eax = Multiboot magic (should be 0x2BADB002)
    ;   ebx = pointer to multiboot_info_t struct
    push ebx            ; arg1: multiboot info pointer
    push eax            ; arg0: magic number

    ; Hand off to the C kernel
    call kernel_main

    ; If kernel_main ever returns, hang the CPU safely
.hang:
    cli
    hlt
    jmp .hang
