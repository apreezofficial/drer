#ifndef INFERENCE_H
#define INFERENCE_H

#include <stddef.h>
#include <stdbool.h>

/* =============================================================================
 * AuraOS — Inference Engine Interface
 *
 * Pluggable AI inference backends:
 *
 *   MOCK    Built-in rule-based responder (no API key needed)
 *   GROQ    Groq cloud API — llama-3.3-70b-versatile (fast, free tier)
 *   GGML    Local llama.cpp model loaded from disk (planned)
 *
 * Set GROQ_API_KEY in your environment before booting to enable Groq.
 * Falls back to MOCK automatically if the key is absent or the request fails.
 *
 * Created by Precious Adedokun — https://preciousadedokun.com.ng
 * Project: https://auraos.com
 * ============================================================================= */

typedef enum {
    INFERENCE_BACKEND_MOCK = 0,
    INFERENCE_BACKEND_GROQ = 1,
    INFERENCE_BACKEND_GGML = 2,
} inference_backend_t;

/* Groq model to use */
#define GROQ_MODEL          "llama-3.3-70b-versatile"
#define GROQ_API_ENDPOINT   "https://api.groq.com/openai/v1/chat/completions"
#define GROQ_MAX_TOKENS     512

typedef struct {
    bool   success;
    char   text[2048];
    int    tokens;
    int    latency_ms;
} inference_result_t;

/* Initialise the inference engine */
bool inference_init(inference_backend_t backend);

/* Set the Groq API key (called during kernel init if env var is present) */
void inference_set_groq_key(const char *key);

/* Run inference: system_ctx is prepended as the system prompt */
inference_result_t inference_run(const char *system_ctx, const char *prompt);

/* Return the name of the active backend */
const char *inference_backend_name(void);

/* Return true if the backend is ready */
bool inference_is_ready(void);

#endif /* INFERENCE_H */
