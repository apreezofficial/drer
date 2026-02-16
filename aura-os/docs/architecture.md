# AuraOS Architecture

## Overview

AuraOS is an x86 32-bit protected-mode operating system built around a single core idea: **AI is a kernel subsystem, not an application**. The AI layer has the same privilege level as the memory manager and interrupt handlers — it sees everything.

---

## Boot Sequence

```
BIOS/UEFI
  └─► GRUB (Multiboot)
        └─► boot.asm (_start)
              ├─ Sets up 16KB stack
              ├─ Passes multiboot magic + info struct
              └─► kernel_main() [C]
                    ├─ VGA init
                    ├─ Serial init
                    ├─ GDT load
                    ├─ IDT load + PIC remap
                    ├─ PMM init (parses multiboot memory map)
                    ├─ VMM init (enables paging)
                    ├─ PIT timer @ 1000 Hz
                    ├─ PS/2 keyboard driver
                    ├─ AI core init
                    └─► shell_run() [interactive loop]
```

---

## Memory Layout

```
0x00000000 - 0x000FFFFF   Lower memory (BIOS, VGA buffer at 0xB8000)
0x00100000 - 0x007FFFFF   Kernel image + early heap (identity-mapped)
0x00800000 - 0xBFFFFFFF   Available for future process address spaces
0xC0000000 - 0xFFFFFFFF   Kernel virtual address space (future higher-half)
```

### Physical Memory Manager (PMM)

- Bitmap allocator: 1 bit per 4KB frame
- 128KB bitmap covers the full 4GB address space
- Parses GRUB multiboot memory map on init
- Marks kernel image, BIOS regions, and bitmap itself as used
- `pmm_alloc_frame()` / `pmm_free_frame()` — O(n/32) allocation

### Virtual Memory Manager (VMM)

- Standard x86 two-level paging (page directory → page tables)
- Kernel identity-mapped for the first 8MB
- `vmm_map_page(virt, phys, flags)` — maps any virtual → physical
- Bump allocator for kernel heap (`kmalloc` / `kmalloc_aligned`)

---

## Interrupt Architecture

```
Hardware IRQ  →  PIC (remapped to INT 32-47)  →  IDT gate  →  irq_common_stub (asm)
                                                               └─► irq_handler (C)
                                                                     └─► registered driver callback

CPU Exception →  IDT gate (INT 0-31)  →  isr_common_stub (asm)
                                          └─► isr_handler (C)  →  kernel panic
```

- PIC remapped: IRQ 0-7 → INT 32-39, IRQ 8-15 → INT 40-47
- All 256 IDT gates populated (unused ones point to a default handler)
- IRQ handlers registered at runtime: `irq_register_handler(irq, fn)`

---

## Driver Layer

| Driver   | IRQ | Description                              |
|----------|-----|------------------------------------------|
| VGA      | —   | 80×25 text mode, 16 colors, hardware cursor |
| Serial   | —   | COM1 @ 38400 baud, debug output          |
| Timer    | 0   | PIT @ 1000 Hz, tick counter, sleep       |
| Keyboard | 1   | PS/2 Set 1 scancodes, shift/caps/ctrl    |

---

## AI Subsystem

See [ai-layer.md](ai-layer.md) for full details.

```
shell / kernel subsystems
        │
        ▼
   ai_core_query(prompt)
        │
        ├─► context_collect()     ← PMM stats, timer, last command
        │
        └─► inference_run(ctx, prompt)
                │
                └─► [MOCK] rule-based responder
                    [GGML] local quantised LLM (planned)
                    [REMOTE] HTTP API (planned, needs networking)
```

---

## Shell Commands

| Command        | Description                          |
|----------------|--------------------------------------|
| `help`         | List all commands                    |
| `clear`        | Clear the screen                     |
| `version`      | OS version info                      |
| `uptime`       | Time since boot                      |
| `meminfo`      | Physical memory statistics           |
| `cpuinfo`      | CPU and kernel configuration         |
| `ai <query>`   | Query the kernel AI assistant        |
| `aistatus`     | AI subsystem status                  |
| `echo <text>`  | Print text                           |
| `reboot`       | Reboot via keyboard controller       |
| `halt`         | Halt the CPU                         |

---

## Roadmap

### v0.2 — Process Management
- Round-robin scheduler with priority queues
- Process control blocks (PCB)
- Context switching (TSS)
- `fork` / `exec` system calls

### v0.3 — Filesystem
- FAT32 driver (read/write)
- VFS abstraction layer
- AI-indexed file metadata

### v0.4 — Networking
- RTL8139 NIC driver
- TCP/IP stack
- Remote AI inference backend

### v0.5 — AI-Native Features
- GGML local inference engine
- AI-driven process scheduler (priority based on predicted CPU need)
- Natural language shell (replace typed commands with NL queries)
- Screen context capture for AI awareness
