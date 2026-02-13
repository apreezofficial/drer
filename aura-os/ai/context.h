#ifndef AI_CONTEXT_H
#define AI_CONTEXT_H

#include <stdint.h>
#include <stddef.h>

/* =============================================================================
 * AuraOS — AI System Context Collector
 * Gathers a snapshot of the current system state to feed into the AI prompt.
 * ============================================================================= */

/* Snapshot of system state at a point in time */
typedef struct {
    /* Memory */
    uint32_t mem_total_kb;
    uint32_t mem_used_kb;
    uint32_t mem_free_kb;

    /* CPU */
    uint32_t uptime_ms;
    uint32_t tick_count;

    /* Last command entered by the user */
    char last_command[128];

    /* Last kernel message */
    char last_kernel_msg[128];

    /* Recent event summary (human-readable) */
    char event_summary[512];
} system_context_t;

/* Collect a fresh system context snapshot */
void context_collect(system_context_t *ctx);

/* Serialise a context snapshot into a prompt-friendly string */
void context_to_string(const system_context_t *ctx, char *buf, size_t len);

/* Update the stored last command (called by the shell) */
void context_set_last_command(const char *cmd);

/* Update the stored last kernel message */
void context_set_last_kernel_msg(const char *msg);

#endif /* AI_CONTEXT_H */
