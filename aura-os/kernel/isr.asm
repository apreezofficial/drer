; =============================================================================
; AuraOS — ISR / IRQ Assembly Stubs
;
; Each stub saves the full CPU state, pushes the interrupt number and error
; code, then calls the common C handler (isr_handler or irq_handler).
;
; Exceptions that push an error code automatically: 8, 10-14, 17, 30.
; All others get a dummy error code of 0 pushed by us.
; =============================================================================

[BITS 32]

; ---- Macros -----------------------------------------------------------------

; Exception WITHOUT an error code — push dummy 0
%macro ISR_NOERR 1
global isr%1
isr%1:
    cli
    push dword 0        ; dummy error code
    push dword %1       ; interrupt number
    jmp isr_common_stub
%endmacro

; Exception WITH an error code already on the stack
%macro ISR_ERR 1
global isr%1
isr%1:
    cli
    push dword %1       ; interrupt number (error code already pushed by CPU)
    jmp isr_common_stub
%endmacro

; Hardware IRQ — remap to interrupt 32+N
%macro IRQ 2
global irq%1
irq%1:
    cli
    push dword 0        ; dummy error code
    push dword %2       ; interrupt number (32 + IRQ line)
    jmp irq_common_stub
%endmacro

; ---- CPU Exception stubs (0-31) --------------------------------------------

ISR_NOERR  0    ; Divide by zero
ISR_NOERR  1    ; Debug
ISR_NOERR  2    ; Non-maskable interrupt
ISR_NOERR  3    ; Breakpoint
ISR_NOERR  4    ; Overflow
ISR_NOERR  5    ; Bound range exceeded
ISR_NOERR  6    ; Invalid opcode
ISR_NOERR  7    ; Device not available
ISR_ERR    8    ; Double fault          (has error code)
ISR_NOERR  9    ; Coprocessor segment overrun
ISR_ERR   10    ; Invalid TSS           (has error code)
ISR_ERR   11    ; Segment not present   (has error code)
ISR_ERR   12    ; Stack-segment fault   (has error code)
ISR_ERR   13    ; General protection    (has error code)
ISR_ERR   14    ; Page fault            (has error code)
ISR_NOERR 15    ; Reserved
ISR_NOERR 16    ; x87 FPU error
ISR_ERR   17    ; Alignment check       (has error code)
ISR_NOERR 18    ; Machine check
ISR_NOERR 19    ; SIMD floating-point
ISR_NOERR 20    ; Virtualization
ISR_NOERR 21    ; Reserved
ISR_NOERR 22    ; Reserved
ISR_NOERR 23    ; Reserved
ISR_NOERR 24    ; Reserved
ISR_NOERR 25    ; Reserved
ISR_NOERR 26    ; Reserved
ISR_NOERR 27    ; Reserved
ISR_NOERR 28    ; Reserved
ISR_NOERR 29    ; Reserved
ISR_ERR   30    ; Security exception    (has error code)
ISR_NOERR 31    ; Reserved

; ---- Hardware IRQ stubs (IRQ 0-15 → INT 32-47) ----------------------------

IRQ  0, 32      ; PIT timer
IRQ  1, 33      ; PS/2 keyboard
IRQ  2, 34      ; Cascade (never raised)
IRQ  3, 35      ; COM2
IRQ  4, 36      ; COM1
IRQ  5, 37      ; LPT2
IRQ  6, 38      ; Floppy disk
IRQ  7, 39      ; LPT1 / spurious
IRQ  8, 40      ; CMOS real-time clock
IRQ  9, 41      ; Free / ACPI
IRQ 10, 42      ; Free
IRQ 11, 43      ; Free
IRQ 12, 44      ; PS/2 mouse
IRQ 13, 45      ; FPU / coprocessor
IRQ 14, 46      ; Primary ATA
IRQ 15, 47      ; Secondary ATA

; ---- Common exception stub -------------------------------------------------

extern isr_handler

isr_common_stub:
    pusha                   ; push edi,esi,ebp,esp,ebx,edx,ecx,eax
    mov  ax, ds
    push eax                ; save data segment
    mov  ax, 0x10           ; load kernel data segment
    mov  ds, ax
    mov  es, ax
    mov  fs, ax
    mov  gs, ax
    push esp                ; pass pointer to registers_t
    call isr_handler
    add  esp, 4
    pop  eax                ; restore data segment
    mov  ds, ax
    mov  es, ax
    mov  fs, ax
    mov  gs, ax
    popa
    add  esp, 8             ; pop int_no and err_code
    sti
    iret

; ---- Common IRQ stub -------------------------------------------------------

extern irq_handler

irq_common_stub:
    pusha
    mov  ax, ds
    push eax
    mov  ax, 0x10
    mov  ds, ax
    mov  es, ax
    mov  fs, ax
    mov  gs, ax
    push esp
    call irq_handler
    add  esp, 4
    pop  eax
    mov  ds, ax
    mov  es, ax
    mov  fs, ax
    mov  gs, ax
    popa
    add  esp, 8
    sti
    iret

; ---- GDT / IDT flush stubs -------------------------------------------------

global gdt_flush
gdt_flush:
    mov  eax, [esp+4]       ; load GDT pointer argument
    lgdt [eax]
    mov  ax, 0x10           ; kernel data selector
    mov  ds, ax
    mov  es, ax
    mov  fs, ax
    mov  gs, ax
    mov  ss, ax
    jmp  0x08:.flush        ; far jump to reload CS with kernel code selector
.flush:
    ret

global idt_flush
idt_flush:
    mov  eax, [esp+4]
    lidt [eax]
    ret
