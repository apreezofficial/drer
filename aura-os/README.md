# AuraOS

**Created by [Precious Adedokun](https://preciousadedokun.com.ng) — [auraos.com](https://auraos.com)**

An AI-native operating system where artificial intelligence is a first-class kernel subsystem — not an app, not a plugin, but woven into the OS itself.

## AI — Groq powered

AuraOS uses [Groq](https://groq.com) (`llama-3.3-70b-versatile`) as the AI backend. The kernel talks to Groq through a serial port proxy — no networking stack needed at this stage.

```
aura@os> ai explain how the PMM bitmap works
  [AuraAI] The PMM uses a flat bitmap where each bit represents one 4KB
           physical frame. A set bit means the frame is allocated...
```

Set `GROQ_API_KEY` before booting. Falls back to the built-in mock engine if the key is absent. See [docs/run.md](docs/run.md) for full setup.

## What makes it different

Most OSes treat AI as an application running in user space. AuraOS runs the AI core at kernel privilege level, giving it direct access to memory stats, interrupt history, system timers, and the keyboard input stream. When you ask the AI a question, it answers with real system data.

```
aura@os> ai why is memory usage high
  [AuraAI] The kernel heap is using 2MB. The PMM bitmap takes 128KB.
           No user processes are running. Total: 2.1MB / 128MB used.

aura@os> ai how does paging work in this kernel
  [AuraAI] AuraOS uses x86 two-level paging. The page directory has 1024
           entries, each pointing to a page table with 1024 4KB pages.
           The kernel is identity-mapped for the first 8MB...
```

## Architecture

```
┌─────────────────────────────────────────────┐
│                   Shell                      │
├─────────────────────────────────────────────┤
│              AI Core Subsystem               │
│   context collector │ inference engine       │
├──────────────┬──────────────────────────────┤
│   Drivers    │      Kernel Core              │
│  VGA Serial  │  GDT  IDT  PMM  VMM  Timer   │
├──────────────┴──────────────────────────────┤
│         GRUB Multiboot Bootloader            │
└─────────────────────────────────────────────┘
```

Full architecture docs: [docs/architecture.md](docs/architecture.md)  
AI layer deep-dive: [docs/ai-layer.md](docs/ai-layer.md)

## Building

### Prerequisites

| Tool | Purpose |
|------|---------|
| `nasm` | Assembler for boot + ISR stubs |
| `i686-elf-gcc` | Cross-compiler (freestanding C) |
| `i686-elf-ld` | Cross-linker |
| `qemu-system-i386` | Emulator |
| `grub-mkrescue` + `xorriso` | ISO creation (optional) |

Setting up the cross-compiler: [OSDev Wiki — GCC Cross-Compiler](https://wiki.osdev.org/GCC_Cross-Compiler)

### Commands

```bash
make          # Build the kernel ELF
make iso      # Create a bootable ISO (needs grub-mkrescue)
make run      # Run directly in QEMU (no ISO needed)
make run-iso  # Run the ISO in QEMU
make debug    # Launch QEMU with GDB stub on :1234
make clean    # Remove build artifacts
```

### Quick start (Linux)

```bash
# Install tools (Ubuntu/Debian)
sudo apt install nasm qemu-system-x86 xorriso grub-pc-bin

# Build the cross-compiler (one-time, ~10 min)
# See: https://wiki.osdev.org/GCC_Cross-Compiler

# Build and run
make run
```

## Project Structure

```
aura-os/
├── boot/           Bootloader (GRUB Multiboot entry, linker script)
├── kernel/         Core kernel
│   ├── gdt.c/h     Global Descriptor Table
│   ├── idt.c/h     Interrupt Descriptor Table
│   ├── isr.c/h/asm Interrupt service routines (all 256 vectors)
│   ├── timer.c/h   PIT timer driver
│   ├── keyboard.c/h PS/2 keyboard driver
│   └── memory/
│       ├── pmm.c/h Physical memory manager (bitmap allocator)
│       └── vmm.c/h Virtual memory manager (x86 paging)
├── drivers/
│   ├── vga.c/h     VGA text mode driver (80×25, 16 colors)
│   └── serial.c/h  Serial port driver (COM1, debug output)
├── lib/
│   ├── string.c/h  memset/memcpy/strlen/strcmp/itoa/...
│   └── stdio.c/h   kprintf / ksprintf
├── ai/
│   ├── ai_core.c/h AI orchestrator + event ring buffer
│   ├── context.c/h System state collector
│   └── inference.c/h Pluggable inference backend
├── shell/
│   └── shell.c/h   Interactive shell
└── docs/
    ├── architecture.md  Full system design
    └── ai-layer.md      AI subsystem deep-dive
```

## Roadmap

- [x] Bootloader + kernel entry (Multiboot)
- [x] GDT — kernel/user segments
- [x] IDT — all 256 interrupt vectors
- [x] ISR stubs — all 32 CPU exceptions + 16 hardware IRQs
- [x] PIC remapping
- [x] Physical memory manager (bitmap, multiboot mmap)
- [x] Virtual memory / x86 paging
- [x] VGA text driver (scroll, color, cursor)
- [x] Serial debug driver
- [x] PS/2 keyboard driver
- [x] PIT timer (1000 Hz, sleep)
- [x] kprintf / ksprintf
- [x] AI core subsystem (event ring, context, inference)
- [x] Interactive shell with AI integration
- [ ] Process scheduler (round-robin + priority)
- [ ] FAT32 filesystem
- [ ] GGML local inference engine
- [ ] Networking (RTL8139 + TCP/IP)
- [ ] Natural language shell interface
