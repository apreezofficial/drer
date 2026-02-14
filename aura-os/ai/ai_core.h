#ifndef AI_CORE_H
#define AI_CORE_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/* =============================================================================
 * AuraOS — AI Core Subsystem
 *
 * The AI core is a kernel-level subsystem that provides AI assistance as a
 * first-class OS service. It maintains a rolling context window of system
 * events and exposes a simple query API to the shell and other subsystems.
 *
 * Architecture:
 *   ai_core  ←→  context (system state collector)
 *            ←→  inference (pluggable inference backend)
 * ============================================================================= */

#define AI_MAX_PROMPT_LEN   1024
#define AI_MAX_RESPONSE_LEN 2048
#define AI_EVENT_RING_SIZE  64

/* Types of system events tracked for AI context */
typedef enum {
    AI_EVENT_KEYPRESS   = 0,
    AI_EVENT_COMMAND    = 1,
    AI_EVENT_SYSCALL    = 2,
    AI_EVENT_FAULT      = 3,
    AI_EVENT_MEMALLOC   = 4,
    AI_EVENT_CUSTOM     = 5,
} ai_event_type_t;

/* A single system event in the context ring buffer */
typedef struct {
    ai_event_type_t type;
    uint64_t        timestamp_ms;
    char            data[128];
} ai_event_t;

/* AI query result */
typedef struct {
    bool  success;
    char  response[AI_MAX_RESPONSE_LEN];
    int   tokens_used;
    int   latency_ms;
} ai_result_t;

/* Initialise the AI core subsystem */
void ai_core_init(void);

/* Push a system event into the context ring buffer */
void ai_core_push_event(ai_event_type_t type, const char *data);

/* Submit a natural-language query and get a response */
ai_result_t ai_core_query(const char *prompt);

/* Get a summary of the current system context as a string */
void ai_core_get_context_summary(char *buf, size_t len);

/* Return true if the AI subsystem is ready */
bool ai_core_is_ready(void);

/* Print AI subsystem status to the console */
void ai_core_print_status(void);

#endif /* AI_CORE_H */
