/* =============================================================================
 * AuraOS — Interactive Shell
 * Reads commands from the keyboard, dispatches to built-in handlers,
 * and forwards "ai <query>" to the AI core subsystem.
 * ============================================================================= */

#include "shell.h"
#include "../drivers/vga.h"
#include "../kernel/keyboard.h"
#include "../kernel/timer.h"
#include "../kernel/memory/pmm.h"
#include "../ai/ai_core.h"
#include "../ai/context.h"
#include "../ai/screen_ai.h"
#include "../lib/stdio.h"
#include "../lib/string.h"

#define CMD_BUF_SIZE 256
#define MAX_ARGS     16

/* ---- Helpers -------------------------------------------------------------- */

static void shell_print_prompt(void) {
    vga_set_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    vga_puts("aura");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    vga_puts("@os");
    vga_set_color(VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);
    vga_puts("> ");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
}

/* Split a command string into argv-style tokens (modifies buf in-place) */
static int shell_tokenise(char *buf, char *argv[], int max_args) {
    int argc = 0;
    char *p  = buf;

    while (*p && argc < max_args) {
        /* Skip leading spaces */
        while (*p == ' ') p++;
        if (!*p) break;

        argv[argc++] = p;

        /* Find end of token */
        while (*p && *p != ' ') p++;
        if (*p) *p++ = '\0';
    }
    return argc;
}

/* ---- Built-in commands ---------------------------------------------------- */

static void cmd_help(void) {
    vga_set_color(VGA_COLOR_YELLOW, VGA_COLOR_BLACK);
    kprintf("\n  AuraOS Shell Commands\n");
    kprintf("  ─────────────────────────────────────────\n");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    kprintf("  help              Show this help message\n");
    kprintf("  clear             Clear the screen\n");
    kprintf("  version           Show OS version\n");
    kprintf("  uptime            Show system uptime\n");
    kprintf("  meminfo           Physical memory statistics\n");
    kprintf("  cpuinfo           CPU and kernel info\n");
    kprintf("  ai <query>        Query the AI assistant\n");
    kprintf("  aistatus          Show AI subsystem status\n");
    kprintf("  aiscreen [q]      Analyse screen with AI (or ask a question)\n");
    kprintf("  echo <text>       Print text to screen\n");
    kprintf("  reboot            Reboot the system\n");
    kprintf("  halt              Halt the CPU\n");
    kprintf("\n");
    vga_set_color(VGA_COLOR_DARK_GREY, VGA_COLOR_BLACK);
    kprintf("  Hotkey: Win+A+O   Trigger screen AI from anywhere\n");
    kprintf("\n");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
}

static void cmd_clear(void) {
    vga_clear();
}

static void cmd_version(void) {
    vga_set_color(VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);
    kprintf("\n  AuraOS v0.1.0\n");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    kprintf("  AI-native kernel — x86 protected mode\n");
    kprintf("  Built with i686-elf-gcc + NASM + GRUB Multiboot\n\n");
}

static void cmd_uptime(void) {
    uint64_t ms  = timer_get_ms();
    uint32_t sec = (uint32_t)(ms / 1000);
    uint32_t min = sec / 60;
    uint32_t hr  = min / 60;
    sec %= 60; min %= 60;
    kprintf("  Uptime: %02d:%02d:%02d (%d ms, %d ticks)\n",
            hr, min, sec, (int)ms, (int)timer_get_ticks());
}

static void cmd_meminfo(void) {
    size_t total = pmm_total_frames() * 4;   /* KB */
    size_t used  = pmm_used_frames()  * 4;
    size_t free  = pmm_free_frames()  * 4;

    vga_set_color(VGA_COLOR_YELLOW, VGA_COLOR_BLACK);
    kprintf("\n  Physical Memory\n");
    kprintf("  ─────────────────────────────────────────\n");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    kprintf("  Total  : %6d KB  (%d MB)\n", (int)total, (int)(total / 1024));
    kprintf("  Used   : %6d KB  (%d MB)\n", (int)used,  (int)(used  / 1024));
    kprintf("  Free   : %6d KB  (%d MB)\n", (int)free,  (int)(free  / 1024));
    kprintf("  Frames : %d total, %d used, %d free\n\n",
            (int)pmm_total_frames(), (int)pmm_used_frames(), (int)pmm_free_frames());
}

static void cmd_cpuinfo(void) {
    vga_set_color(VGA_COLOR_YELLOW, VGA_COLOR_BLACK);
    kprintf("\n  CPU / Kernel Info\n");
    kprintf("  ─────────────────────────────────────────\n");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    kprintf("  Architecture : x86 (i686), 32-bit protected mode\n");
    kprintf("  GDT          : 5 segments (null, kcode, kdata, ucode, udata)\n");
    kprintf("  IDT          : 256 gates (32 exceptions + 16 IRQs)\n");
    kprintf("  Paging       : enabled (identity-mapped kernel)\n");
    kprintf("  Timer        : PIT @ 1000 Hz\n");
    kprintf("  AI backend   : %s\n\n", inference_backend_name());
}

static void cmd_ai(int argc, char *argv[]) {
    if (argc < 2) {
        kprintf("  Usage: ai <your question>\n");
        kprintf("  Example: ai how does memory work\n\n");
        return;
    }

    /* Reconstruct the full query from remaining tokens */
    char query[CMD_BUF_SIZE] = "";
    for (int i = 1; i < argc; i++) {
        if (i > 1) strcat(query, " ");
        strncat(query, argv[i], sizeof(query) - strlen(query) - 1);
    }

    /* Update context with this command */
    char full_cmd[CMD_BUF_SIZE + 4];
    ksprintf(full_cmd, "ai %s", query);
    context_set_last_command(full_cmd);

    vga_set_color(VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);
    kprintf("\n  [AuraAI] Thinking...\n");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);

    ai_result_t result = ai_core_query(query);

    if (result.success) {
        vga_set_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
        kprintf("  [AuraAI] ");
        vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
        kprintf("%s\n", result.response);
        vga_set_color(VGA_COLOR_DARK_GREY, VGA_COLOR_BLACK);
        kprintf("  (%d tokens, %d ms)\n\n", result.tokens_used, result.latency_ms);
        vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    } else {
        vga_set_color(VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
        kprintf("  [AuraAI] Error: %s\n\n", result.response);
        vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    }
}

static void cmd_aistatus(void) {
    vga_set_color(VGA_COLOR_YELLOW, VGA_COLOR_BLACK);
    kprintf("\n  AI Subsystem Status\n");
    kprintf("  ─────────────────────────────────────────\n");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    ai_core_print_status();
    kprintf("\n");
}

static void cmd_aiscreen(int argc, char *argv[]) {
    /* Optional: pass a question as arguments */
    char question[256] = "";
    for (int i = 1; i < argc; i++) {
        if (i > 1) strcat(question, " ");
        strncat(question, argv[i], sizeof(question) - strlen(question) - 1);
    }
    screen_ai_trigger(question[0] ? question : (char *)0);
}

static void cmd_echo(int argc, char *argv[]) {
    for (int i = 1; i < argc; i++) {
        if (i > 1) vga_putchar(' ');
        vga_puts(argv[i]);
    }
    vga_putchar('\n');
}

static void cmd_reboot(void) {
    kprintf("  Rebooting...\n");
    /* Pulse the keyboard controller reset line */
    uint8_t good = 0x02;
    while (good & 0x02) {
        __asm__ volatile ("inb $0x64, %0" : "=a"(good));
    }
    __asm__ volatile ("outb %0, $0x64" : : "a"((uint8_t)0xFE));
    /* If that fails, triple-fault */
    __asm__ volatile ("cli; hlt");
}

static void cmd_halt(void) {
    kprintf("  System halted. Safe to power off.\n");
    __asm__ volatile ("cli; hlt");
    for (;;);
}

/* ---- Command dispatcher --------------------------------------------------- */

static void shell_dispatch(char *buf) {
    if (!buf || !*buf) return;

    char *argv[MAX_ARGS];
    int   argc = shell_tokenise(buf, argv, MAX_ARGS);
    if (argc == 0) return;

    /* Update AI context with the command */
    context_set_last_command(buf);
    ai_core_push_event(AI_EVENT_COMMAND, buf);

    if      (strcmp(argv[0], "help")     == 0) cmd_help();
    else if (strcmp(argv[0], "clear")    == 0) cmd_clear();
    else if (strcmp(argv[0], "version")  == 0) cmd_version();
    else if (strcmp(argv[0], "uptime")   == 0) cmd_uptime();
    else if (strcmp(argv[0], "meminfo")  == 0) cmd_meminfo();
    else if (strcmp(argv[0], "cpuinfo")  == 0) cmd_cpuinfo();
    else if (strcmp(argv[0], "ai")       == 0) cmd_ai(argc, argv);
    else if (strcmp(argv[0], "aistatus") == 0) cmd_aistatus();
    else if (strcmp(argv[0], "aiscreen") == 0) cmd_aiscreen(argc, argv);
    else if (strcmp(argv[0], "echo")     == 0) cmd_echo(argc, argv);
    else if (strcmp(argv[0], "reboot")   == 0) cmd_reboot();
    else if (strcmp(argv[0], "halt")     == 0) cmd_halt();
    else {
        vga_set_color(VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
        kprintf("  Unknown command: '%s'. Type 'help' for a list.\n", argv[0]);
        vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    }
}

/* ---- Shell banner --------------------------------------------------------- */

static void shell_banner(void) {
    vga_set_color(VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);
    kprintf("\n");
    kprintf("   █████╗ ██╗   ██╗██████╗  █████╗      ██████╗ ███████╗\n");
    kprintf("  ██╔══██╗██║   ██║██╔══██╗██╔══██╗    ██╔═══██╗██╔════╝\n");
    kprintf("  ███████║██║   ██║██████╔╝███████║    ██║   ██║███████╗ \n");
    kprintf("  ██╔══██║██║   ██║██╔══██╗██╔══██║    ██║   ██║╚════██║ \n");
    kprintf("  ██║  ██║╚██████╔╝██║  ██║██║  ██║    ╚██████╔╝███████║ \n");
    kprintf("  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝ \n");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    kprintf("\n  AI-Native Operating System  |  v0.1.0\n");
    vga_set_color(VGA_COLOR_DARK_GREY, VGA_COLOR_BLACK);
    kprintf("  Type 'help' for commands. Try 'ai hello' to talk to the kernel AI.\n\n");
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_BLACK);
}

/* ---- Main shell loop ------------------------------------------------------ */

void shell_run(void) {
    shell_banner();

    char cmd_buf[CMD_BUF_SIZE];

    for (;;) {
        shell_print_prompt();
        keyboard_readline(cmd_buf, sizeof(cmd_buf));

        /* Trim trailing whitespace */
        int len = (int)strlen(cmd_buf);
        while (len > 0 && (cmd_buf[len-1] == ' ' || cmd_buf[len-1] == '\t'))
            cmd_buf[--len] = '\0';

        shell_dispatch(cmd_buf);
    }
}
