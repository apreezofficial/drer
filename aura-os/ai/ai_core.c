/* =============================================================================
 * AuraOS — AI Core Subsystem
 * Ties together the context collector and inference engine.
 * Maintains a ring buffer of system events for rolling context.
 * ============================================================================= */

#include "ai_core.h"
#include "context.h"
#include "inference.h"
#include "../lib/string.h"
#include "../lib/stdio.h"
#include "../kernel/timer.h"

/* ---- Event ring buffer ---------------------------------------------------- */
static ai_event_t event_ring[AI_EVENT_RING_SIZE];
static int        ring_head = 0;
static int        ring_count = 0;
static bool       core_ready = false;

/* ---- Init ----------------------------------------------------------------- */

void ai_core_init(void) {
    memset(event_ring, 0, sizeof(event_ring));
    ring_head  = 0;
    ring_count = 0;

    /* Initialise the inference engine.
     * Tries Groq first — falls back to mock if key is not set. */
    inference_init(INFERENCE_BACKEND_GROQ);

    core_ready = true;

    kprintf("[AI]  Core initialised. Backend: %s\n", inference_backend_name());
}

/* ---- Event ring ----------------------------------------------------------- */

void ai_core_push_event(ai_event_type_t type, const char *data) {
    ai_event_t *ev = &event_ring[ring_head % AI_EVENT_RING_SIZE];
    ev->type         = type;
    ev->timestamp_ms = timer_get_ms();
    strncpy(ev->data, data, sizeof(ev->data) - 1);
    ev->data[sizeof(ev->data) - 1] = '\0';

    ring_head = (ring_head + 1) % AI_EVENT_RING_SIZE;
    if (ring_count < AI_EVENT_RING_SIZE) ring_count++;
}

/* ---- Context summary ------------------------------------------------------ */

void ai_core_get_context_summary(char *buf, size_t len) {
    system_context_t ctx;
    context_collect(&ctx);
    context_to_string(&ctx, buf, len);

    /* Append recent events */
    char event_buf[256] = "\nRecent events:\n";
    int  start = (ring_head - ring_count + AI_EVENT_RING_SIZE) % AI_EVENT_RING_SIZE;

    for (int i = 0; i < ring_count && i < 5; i++) {
        int idx = (start + i) % AI_EVENT_RING_SIZE;
        char line[64];
        ksprintf(line, "  [%dms] %s\n",
                 (int)event_ring[idx].timestamp_ms,
                 event_ring[idx].data);
        strncat(event_buf, line, sizeof(event_buf) - strlen(event_buf) - 1);
    }

    strncat(buf, event_buf, len - strlen(buf) - 1);
    buf[len - 1] = '\0';
}

/* ---- Query ---------------------------------------------------------------- */

ai_result_t ai_core_query(const char *prompt) {
    ai_result_t result;

    if (!core_ready || !inference_is_ready()) {
        result.success      = false;
        result.tokens_used  = 0;
        result.latency_ms   = 0;
        strncpy(result.response, "AI core is not ready.", sizeof(result.response) - 1);
        return result;
    }

    /* Collect system context */
    char ctx_buf[512];
    ai_core_get_context_summary(ctx_buf, sizeof(ctx_buf));

    /* Log the query as an event */
    ai_core_push_event(AI_EVENT_COMMAND, prompt);

    /* Run inference */
    uint64_t t0 = timer_get_ms();
    inference_result_t inf = inference_run(ctx_buf, prompt);
    uint64_t t1 = timer_get_ms();

    result.success     = inf.success;
    result.tokens_used = inf.tokens;
    result.latency_ms  = (int)(t1 - t0);
    strncpy(result.response, inf.text, sizeof(result.response) - 1);
    result.response[sizeof(result.response) - 1] = '\0';

    return result;
}

/* ---- Status --------------------------------------------------------------- */

bool ai_core_is_ready(void) {
    return core_ready && inference_is_ready();
}

void ai_core_print_status(void) {
    kprintf("  AI Core     : %s\n", core_ready ? "online" : "offline");
    kprintf("  Backend     : %s\n", inference_backend_name());
    kprintf("  Events      : %d in ring buffer\n", ring_count);
    kprintf("  Ready       : %s\n", ai_core_is_ready() ? "yes" : "no");
}
