# =============================================================================
# AuraOS Makefile
# Requires: nasm, i686-elf-gcc, i686-elf-ld, qemu-system-i386
#           grub-mkrescue + xorriso (for ISO target)
# =============================================================================

# ---- Toolchain --------------------------------------------------------------
CC      := i686-elf-gcc
LD      := i686-elf-ld
AS      := nasm
OBJCOPY := i686-elf-objcopy

# ---- Flags ------------------------------------------------------------------
CFLAGS  := -std=gnu99 -ffreestanding -O2 -Wall -Wextra \
           -Wno-unused-parameter -fno-stack-protector \
           -Ikernel -Idrivers -Ilib -Iai -Ishell

ASFLAGS := -f elf32
LDFLAGS := -T boot/linker.ld -nostdlib

# ---- Output -----------------------------------------------------------------
BUILD   := build
KERNEL  := $(BUILD)/aura.elf
ISO     := $(BUILD)/aura.iso
ISODIR  := $(BUILD)/isodir

# ---- Sources ----------------------------------------------------------------
C_SRCS := \
    kernel/kernel.c       \
    kernel/gdt.c          \
    kernel/idt.c          \
    kernel/isr.c          \
    kernel/timer.c        \
    kernel/keyboard.c     \
    kernel/memory/pmm.c   \
    kernel/memory/vmm.c   \
    drivers/vga.c         \
    drivers/serial.c      \
    drivers/screen_capture.c \
    lib/string.c          \
    lib/stdio.c           \
    ai/ai_core.c          \
    ai/context.c          \
    ai/inference.c        \
    ai/screen_ai.c        \
    shell/shell.c

ASM_SRCS := \
    boot/boot.asm         \
    kernel/isr.asm

# ---- Object files -----------------------------------------------------------
C_OBJS   := $(patsubst %.c,   $(BUILD)/%.o, $(C_SRCS))
ASM_OBJS := $(patsubst %.asm, $(BUILD)/%.o, $(ASM_SRCS))
ALL_OBJS := $(ASM_OBJS) $(C_OBJS)

# ---- Default target ---------------------------------------------------------
.PHONY: all iso run debug clean

all: $(KERNEL)

# ---- Link -------------------------------------------------------------------
$(KERNEL): $(ALL_OBJS) | $(BUILD)
	$(LD) $(LDFLAGS) -o $@ $^
	@echo ""
	@echo "  Kernel built: $@"
	@echo "  Size: $$(wc -c < $@) bytes"

# ---- Compile C --------------------------------------------------------------
$(BUILD)/%.o: %.c | $(BUILD)
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

# ---- Assemble ---------------------------------------------------------------
$(BUILD)/%.o: %.asm | $(BUILD)
	@mkdir -p $(dir $@)
	$(AS) $(ASFLAGS) $< -o $@

# ---- Create build dir -------------------------------------------------------
$(BUILD):
	mkdir -p $(BUILD)

# ---- ISO target -------------------------------------------------------------
iso: $(KERNEL)
	mkdir -p $(ISODIR)/boot/grub
	cp $(KERNEL) $(ISODIR)/boot/aura.elf
	echo 'set timeout=0'                          >  $(ISODIR)/boot/grub/grub.cfg
	echo 'set default=0'                          >> $(ISODIR)/boot/grub/grub.cfg
	echo 'menuentry "AuraOS" {'                   >> $(ISODIR)/boot/grub/grub.cfg
	echo '    multiboot /boot/aura.elf'           >> $(ISODIR)/boot/grub/grub.cfg
	echo '    boot'                               >> $(ISODIR)/boot/grub/grub.cfg
	echo '}'                                      >> $(ISODIR)/boot/grub/grub.cfg
	grub-mkrescue -o $(ISO) $(ISODIR)
	@echo "  ISO created: $(ISO)"

# ---- Run in QEMU ------------------------------------------------------------
run: $(KERNEL)
	qemu-system-i386 \
	    -kernel $(KERNEL) \
	    -serial stdio \
	    -m 128M \
	    -display sdl \
	    -no-reboot

# ---- Run ISO in QEMU --------------------------------------------------------
run-iso: iso
	qemu-system-i386 \
	    -cdrom $(ISO) \
	    -serial stdio \
	    -m 128M \
	    -display sdl \
	    -no-reboot

# ---- Debug (GDB stub) -------------------------------------------------------
debug: $(KERNEL)
	qemu-system-i386 \
	    -kernel $(KERNEL) \
	    -serial stdio \
	    -m 128M \
	    -s -S \
	    -no-reboot &
	i686-elf-gdb $(KERNEL) \
	    -ex "target remote :1234" \
	    -ex "break kernel_main" \
	    -ex "continue"

# ---- Clean ------------------------------------------------------------------
clean:
	rm -rf $(BUILD)
	@echo "  Cleaned."
