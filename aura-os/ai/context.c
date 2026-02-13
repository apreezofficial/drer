/* =============================================================================
 * AuraOS — AI System Context Collector
 * Builds a structured snapshot of system state for use as AI prompt context.
 * ============================================================================= */

#include "context.h"
#include "../kernel/memory/pmm.h"
#include "../kernel/timer.h"
#include "../lib/string.h"
#include "../lib/stdio.h"

static char last_command[128]    = "(none)";
static char last_kernel_msg[128] = "(none)";

void context_set_last_command(const char *cmd) {
    strncpy(last_command, cmd, sizeof(last_command) - 1);
    last_command[sizeof(last_command) - 1] = '\0';
}

void context_set_last_kernel_msg(const char *msg) {
    strncpy(last_kernel_msg, msg, sizeof(last_kernel_msg) - 1);
    last_kernel_msg[sizeof(last_kernel_msg) - 1] = '\0';
}

void context_collect(system_context_t *ctx) {
    /* Memory stats from PMM */
    ctx->mem_total_kb = (uint32_t)((pmm_total_frames() * 4096) / 1024);
    ctx->mem_used_kb  = (uint32_t)((pmm_used_frames()  * 4096) / 1024);
    ctx->mem_free_kb  = (uint32_t)((pmm_free_frames()  * 4096) / 1024);

    /* Timing */
    ctx->uptime_ms  = (uint32_t)timer_get_ms();
    ctx->tick_count = (uint32_t)timer_get_ticks();

    /* Last command / message */
    strncpy(ctx->last_command,    last_command,    sizeof(ctx->last_command) - 1);
    strncpy(ctx->last_kernel_msg, last_kernel_msg, sizeof(ctx->last_kernel_msg) - 1);

    /* Build a brief event summary */
    ksprintf(ctx->event_summary,
             "Uptime: %dms | RAM: %dKB used / %dKB free | Last cmd: %s",
             ctx->uptime_ms, ctx->mem_used_kb, ctx->mem_free_kb,
             ctx->last_command);
}

void context_to_string(const system_context_t *ctx, char *buf, size_t len) {
    ksprintf(buf,
        "[System Context]\n"
        "  Uptime     : %d ms\n"
        "  Memory     : %d KB total, %d KB used, %d KB free\n"
        "  Last cmd   : %s\n"
        "  Kernel msg : %s\n",
        ctx->uptime_ms,
        ctx->mem_total_kb, ctx->mem_used_kb, ctx->mem_free_kb,
        ctx->last_command,
        ctx->last_kernel_msg);

    /* Ensure null termination */
    buf[len - 1] = '\0';
}
