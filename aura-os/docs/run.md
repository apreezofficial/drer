# Running AuraOS

**Created by [Precious Adedokun](https://preciousadedokun.com.ng)**  
**Project site: [auraos.com](https://auraos.com)**

---

## Prerequisites

AuraOS builds on Linux or WSL2 (Windows). You need:

| Tool | Purpose |
|------|---------|
| `nasm` | Assembles the bootloader and ISR stubs |
| `i686-elf-gcc` | Freestanding C cross-compiler |
| `i686-elf-ld` | Cross-linker |
| `qemu-system-i386` | Runs the kernel without real hardware |
| `grub-mkrescue` + `xorriso` | Creates a bootable ISO (optional) |

---

## Setup on Windows (WSL2)

### 1. Install WSL2

Open PowerShell as Administrator:

```powershell
wsl --install
```

Restart your machine, then open **Ubuntu** from the Start menu.

### 2. Install packages

```bash
sudo apt update
sudo apt install -y nasm qemu-system-x86 xorriso grub-pc-bin \
    build-essential bison flex libgmp-dev libmpc-dev libmpfr-dev texinfo wget
```

### 3. Build the i686-elf cross-compiler

This runs once and takes about 10–15 minutes.

```bash
export PREFIX="$HOME/opt/cross"
export TARGET=i686-elf
export PATH="$PREFIX/bin:$PATH"

mkdir -p $HOME/src && cd $HOME/src

# Download sources
wget https://ftp.gnu.org/gnu/binutils/binutils-2.41.tar.gz
wget https://ftp.gnu.org/gnu/gcc/gcc-13.2.0/gcc-13.2.0.tar.gz
tar xf binutils-2.41.tar.gz
tar xf gcc-13.2.0.tar.gz

# Build binutils
mkdir build-binutils && cd build-binutils
../binutils-2.41/configure \
    --target=$TARGET --prefix=$PREFIX \
    --with-sysroot --disable-nls --disable-werror
make -j$(nproc) && make install
cd ..

# Build GCC (C only, no libc)
mkdir build-gcc && cd build-gcc
../gcc-13.2.0/configure \
    --target=$TARGET --prefix=$PREFIX \
    --disable-nls --enable-languages=c --without-headers
make -j$(nproc) all-gcc all-target-libgcc
make install-gcc install-target-libgcc
cd ..
```

Make the compiler available permanently:

```bash
echo 'export PATH="$HOME/opt/cross/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Verify:

```bash
i686-elf-gcc --version
# i686-elf-gcc (GCC) 13.2.0
```

---

## Setup on Linux (Ubuntu / Debian)

Same as WSL2 — skip the WSL install step and run everything directly in your terminal.

---

## Setup on macOS

```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install tools
brew install nasm qemu xorriso

# Cross-compiler via Homebrew
brew tap nativeos/i386-elf-toolchain
brew install i386-elf-binutils i386-elf-gcc
```

> Note: on macOS the compiler may be `i386-elf-gcc` instead of `i686-elf-gcc`. Update the `CC` variable in the Makefile accordingly.

---

## Building AuraOS

Navigate to the project root (where the `Makefile` lives):

```bash
# On WSL — your Windows files are at /mnt/c/
cd /mnt/c/Users/YourName/path/to/aura-os

# Build the kernel ELF
make

# Output: build/aura.elf
```

---

## Running

### Quickest way — run directly in QEMU

```bash
make run
```

This launches QEMU with the kernel loaded directly (no ISO needed). A window opens showing AuraOS booting.

### Run as a bootable ISO

```bash
make iso      # creates build/aura.iso
make run-iso  # boots the ISO in QEMU
```

### Debug with GDB

```bash
make debug
```

This starts QEMU paused with a GDB stub on port `1234`, then launches GDB connected to it with a breakpoint at `kernel_main`. Step through the kernel with full source-level debugging.

---

## First Boot

When AuraOS boots you will see the subsystem initialisation sequence:

```
[AuraOS] Kernel booting...

  [OK] GDT (Global Descriptor Table)
  [OK] IDT (Interrupt Descriptor Table)
  [OK] Interrupts enabled
  [OK] PMM — Total: 127 MB  Free: 125 MB
  [OK] VMM — Paging enabled
  [OK] PIT Timer (1000 Hz)
  [OK] PS/2 Keyboard driver
  [OK] AI Core — Backend: Groq (llama-3.3-70b-versatile)

  All subsystems online.
```

Then the shell banner appears. Try these commands:

```
help                    — list all commands
meminfo                 — physical memory stats
cpuinfo                 — kernel configuration
ai how does paging work — ask the kernel AI
ai why is memory low    — AI answers with live system data
aistatus                — AI subsystem status
```

---

## Enabling Groq AI

AuraOS uses [Groq](https://groq.com) (`llama-3.3-70b-versatile`) for AI inference. Without a key it falls back to the built-in mock engine automatically.

### 1. Get a free API key

Sign up at [console.groq.com](https://console.groq.com) — free tier is generous.

### 2. Set the key

```bash
export GROQ_API_KEY=your_key_here
```

### 3. Run QEMU with a PTY serial port

The kernel talks to Groq through the serial port via a host-side proxy. Use a PTY so the proxy can connect:

```bash
qemu-system-i386 -kernel build/aura.elf -serial pty -m 128M -display sdl -no-reboot
# QEMU prints something like: char device redirected to /dev/pts/3
```

### 4. Start the Groq proxy

In a second terminal:

```bash
pip install pyserial requests
python3 tools/groq_proxy.py --port /dev/pts/3
```

Replace `/dev/pts/3` with the PTY path QEMU printed.

### 5. Use the AI in the shell

```
aura@os> ai explain how the PMM bitmap works
  [AuraAI] The PMM uses a flat bitmap where each bit represents one 4KB
           physical frame. A set bit means the frame is allocated...
           (latency: 340ms, 87 tokens)
```

> The proxy reads requests from the serial port, forwards them to `api.groq.com`, and writes the response back. All context (memory stats, uptime, last command) is automatically included in every prompt.

---

## Troubleshooting

**`i686-elf-gcc: command not found`**  
The cross-compiler is not on your PATH. Run `source ~/.bashrc` or re-export `PATH`.

**QEMU window doesn't open on WSL**  
Install an X server like [VcXsrv](https://sourceforge.net/projects/vcxsrv/) or use WSLg (Windows 11). Then:
```bash
export DISPLAY=:0
make run
```

**`grub-mkrescue: command not found`**  
```bash
sudo apt install grub-pc-bin grub-common xorriso
```

**Kernel triple-faults immediately**  
Run `make debug` and check the GDB output. Common causes: stack not aligned, bad GDT selector in `gdt_flush`, or paging enabled before identity-mapping is complete.

**Serial output not showing**  
The `-serial stdio` flag in the Makefile pipes COM1 to your terminal. If you don't see it, check that QEMU is not opening a separate serial window (`-serial vc` would do that).

---

## Project Links

- Website: [auraos.com](https://auraos.com)
- Author: [Precious Adedokun](https://preciousadedokun.com.ng)
