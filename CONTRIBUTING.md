# Contributing to AuraOS

Thanks for your interest in AuraOS. It's an experimental x86 operating system with an AI shell command, and contributions are welcome, from bug fixes and driver work to docs.

## Getting set up

You need the tools listed in [aura-os/README.md](aura-os/README.md#prerequisites): `nasm`, an `i686-elf` cross-compiler, `i686-elf-ld`, and `qemu-system-i386`. Building the cross-compiler takes a while; the OSDev wiki guide is linked from the README.

From the `aura-os/` directory:

```bash
make          # build the kernel ELF
make run      # run in QEMU
make clean    # remove build artifacts
```

For the Electron overlay, see [aura-os/electron/README.md](aura-os/electron/README.md).

## How to contribute

1. Open an issue first for anything larger than a small fix, so we can agree on the approach.
2. Fork the repo and create a branch from `main`.
3. Make your change and build it with `make` before you push.
4. Open a pull request that describes what changed and why, and how you tested it (for example, "booted in QEMU and ran `ai aistatus`").

## Code guidelines

- The kernel is freestanding C and NASM. Don't add dependencies on the host C library.
- Keep each commit to one logical change, and use a type prefix in the message, such as `kernel/memory: ...` or `fix: ...`.
- Keep the kernel's privilege model in mind: the AI core runs at kernel level, so changes there need extra care.
- Don't commit build artifacts (`*.o`, `*.elf`, `*.iso`) or local config.
- Never commit API keys. `GROQ_API_KEY` is read from the environment only.

## Reporting bugs

Include what you ran, what you expected, what happened, and the QEMU command or host OS you used. Serial output (COM1) is often the most useful debugging information.

## License

The project does not yet have a LICENSE file. Until one is added, please ask before submitting work that you need to be reusable under a specific license.
