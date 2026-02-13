/* =============================================================================
 * AuraOS — Inference Engine
 *
 * Backends:
 *   GROQ  — Groq cloud API using llama-3.3-70b-versatile.
 *            Requires GROQ_API_KEY set before kernel init.
 *            Uses the kernel's serial port to make HTTP requests once
 *            networking is available. In the current early kernel stage,
 *            Groq calls are made via a host-side proxy (see groq_proxy.py).
 *
 *   MOCK  — Built-in rule-based responder. Always available, no key needed.
 *            Used as automatic fallback if Groq is unavailable.
 *
 *   GGML  — Planned: local quantised model loaded from disk.
 *
 * Created by Precious Adedokun — https://preciousadedokun.com.ng
 * Project: https://auraos.com
 * ============================================================================= */

#include "inference.h"
#include "../lib/string.h"
#include "../lib/stdio.h"
#include "../kernel/timer.h"
#include "../drivers/serial.h"

/* ---- State ---------------------------------------------------------------- */

static inference_backend_t active_backend = INFERENCE_BACKEND_MOCK;
static bool                engine_ready   = false;
static char                groq_api_key[256] = {0};

/* ---- Groq serial protocol ------------------------------------------------- */
/*
 * Since the kernel has no TCP/IP stack yet, Groq calls are proxied through
 * the serial port (COM1). The host runs groq_proxy.py which:
 *   1. Reads a JSON request from the serial port
 *   2. Forwards it to api.groq.com
 *   3. Writes the response back over serial
 *
 * Protocol (newline-delimited):
 *   Request:  GROQ_REQ:<base64-encoded JSON>\n
 *   Response: GROQ_RES:<response text>\n  or  GROQ_ERR:<error message>\n
 */

#define GROQ_REQ_PREFIX  "GROQ_REQ:"
#define GROQ_RES_PREFIX  "GROQ_RES:"
#define GROQ_ERR_PREFIX  "GROQ_ERR:"
#define GROQ_TIMEOUT_MS  8000

/* Simple serial readline — reads until \n or timeout */
static int serial_readline_timeout(char *buf, int maxlen, uint32_t timeout_ms) {
    uint64_t deadline = timer_get_ms() + timeout_ms;
    int i = 0;

    while (i < maxlen - 1) {
        /* Check timeout */
        if (timer_get_ms() > deadline) return -1;

        /* Non-blocking serial read via line status */
        uint8_t lsr;
        __asm__ volatile ("inb $0x3FD, %0" : "=a"(lsr));
        if (!(lsr & 0x01)) continue;   /* No data yet */

        char c;
        __asm__ volatile ("inb $0x3F8, %0" : "=a"(c));
        if (c == '\n' || c == '\r') break;
        buf[i++] = c;
    }
    buf[i] = '\0';
    return i;
}

/* Escape a string for JSON (handles quotes and backslashes) */
static void json_escape(const char *src, char *dst, size_t dstlen) {
    size_t j = 0;
    for (size_t i = 0; src[i] && j < dstlen - 2; i++) {
        if (src[i] == '"'  && j < dstlen - 3) { dst[j++] = '\\'; dst[j++] = '"';  }
        else if (src[i] == '\\' && j < dstlen - 3) { dst[j++] = '\\'; dst[j++] = '\\'; }
        else if (src[i] == '\n' && j < dstlen - 3) { dst[j++] = '\\'; dst[j++] = 'n';  }
        else if (src[i] == '\r' && j < dstlen - 3) { dst[j++] = '\\'; dst[j++] = 'r';  }
        else dst[j++] = src[i];
    }
    dst[j] = '\0';
}

static inference_result_t groq_infer(const char *system_ctx, const char *prompt) {
    inference_result_t result;
    result.success    = false;
    result.tokens     = 0;
    result.latency_ms = 0;

    if (!groq_api_key[0]) {
        strncpy(result.text,
            "Groq API key not set. Set GROQ_API_KEY before booting, "
            "or use the mock backend. Falling back to mock.",
            sizeof(result.text) - 1);
        /* Graceful fallback to mock */
        active_backend = INFERENCE_BACKEND_MOCK;
        return result;
    }

    /* Build JSON payload */
    char sys_escaped[512], usr_escaped[512];
    json_escape(system_ctx ? system_ctx : "", sys_escaped, sizeof(sys_escaped));
    json_escape(prompt, usr_escaped, sizeof(usr_escaped));

    char json[1200];
    ksprintf(json,
        "{\"model\":\"%s\","
        "\"max_tokens\":%d,"
        "\"messages\":["
          "{\"role\":\"system\",\"content\":\"You are AuraOS kernel AI. "
            "You have direct access to system state. Be concise and technical. "
            "Context: %s\"},"
          "{\"role\":\"user\",\"content\":\"%s\"}"
        "]}",
        GROQ_MODEL, GROQ_MAX_TOKENS, sys_escaped, usr_escaped);

    /* Send request over serial to the host proxy */
    uint64_t t0 = timer_get_ms();
    serial_print(GROQ_REQ_PREFIX);
    serial_print(json);
    serial_printc('\n');

    /* Wait for response */
    char resp_buf[2100];
    int  n = serial_readline_timeout(resp_buf, sizeof(resp_buf), GROQ_TIMEOUT_MS);
    uint64_t t1 = timer_get_ms();
    result.latency_ms = (int)(t1 - t0);

    if (n < 0) {
        strncpy(result.text,
            "Groq request timed out. Is groq_proxy.py running on the host? "
            "Falling back to mock backend.",
            sizeof(result.text) - 1);
        active_backend = INFERENCE_BACKEND_MOCK;
        return result;
    }

    /* Parse response prefix */
    if (strncmp(resp_buf, GROQ_RES_PREFIX, strlen(GROQ_RES_PREFIX)) == 0) {
        strncpy(result.text, resp_buf + strlen(GROQ_RES_PREFIX),
                sizeof(result.text) - 1);
        result.text[sizeof(result.text) - 1] = '\0';
        result.success = true;
        result.tokens  = (int)strlen(result.text) / 4;
    } else if (strncmp(resp_buf, GROQ_ERR_PREFIX, strlen(GROQ_ERR_PREFIX)) == 0) {
        ksprintf(result.text, "Groq error: %s", resp_buf + strlen(GROQ_ERR_PREFIX));
    } else {
        strncpy(result.text, "Unexpected response from Groq proxy.",
                sizeof(result.text) - 1);
    }

    return result;
}

/* ---- Mock backend --------------------------------------------------------- */

typedef struct { const char *keyword; const char *response; } mock_rule_t;

static const mock_rule_t mock_rules[] = {
    { "memory",    "Memory is managed by AuraOS's bitmap PMM. Each frame is 4KB. Use 'meminfo' to see live stats." },
    { "mem",       "Use 'meminfo' to view physical memory stats: total, used, and free frames." },
    { "cpu",       "AuraOS runs in 32-bit protected mode. GDT has 5 segments. IDT covers 256 vectors (32 exceptions + 16 IRQs)." },
    { "process",   "Process scheduling is on the roadmap. A round-robin scheduler with priority queues is planned next." },
    { "file",      "Filesystem support is planned. FAT32 first, then a custom AuraFS with AI-indexed metadata." },
    { "interrupt", "IRQ 0-15 are remapped to INT 32-47 to avoid conflicts with CPU exceptions. Register handlers with irq_register_handler()." },
    { "boot",      "AuraOS boots via GRUB Multiboot. Bootloader sets up a 16KB stack and passes the multiboot info struct to kernel_main." },
    { "ai",        "The AI subsystem runs at kernel privilege level with direct access to memory, timers, and interrupt history. Backend: Groq llama-3.3-70b-versatile." },
    { "groq",      "AuraOS uses Groq's llama-3.3-70b-versatile model for AI inference. Set GROQ_API_KEY before booting to enable it." },
    { "shell",     "Shell commands: help, clear, meminfo, cpuinfo, uptime, ai <query>, aistatus, echo, version, reboot, halt." },
    { "hello",     "Hello! I'm the AuraOS kernel AI, powered by Groq. I have direct access to system state. Ask me anything." },
    { "help",      "Ask me about: memory, cpu, interrupts, boot process, ai layer, shell commands, or anything about AuraOS internals." },
    { "paging",    "AuraOS uses x86 two-level paging. Page directory has 1024 entries, each pointing to a page table with 1024 4KB pages. Kernel is identity-mapped for the first 8MB." },
    { "version",   "AuraOS v0.1.0 — AI-native kernel by Precious Adedokun. https://auraos.com" },
    { NULL, NULL }
};

static inference_result_t mock_infer(const char *prompt) {
    inference_result_t result;
    result.success    = true;
    result.latency_ms = (int)(timer_get_ms() % 30) + 2;

    for (int i = 0; mock_rules[i].keyword; i++) {
        if (strstr(prompt, mock_rules[i].keyword)) {
            strncpy(result.text, mock_rules[i].response, sizeof(result.text) - 1);
            result.text[sizeof(result.text) - 1] = '\0';
            result.tokens = (int)strlen(result.text) / 4;
            return result;
        }
    }

    ksprintf(result.text,
        "Query received: \"%s\"\n"
        "Running on mock backend (Groq key not set or proxy unavailable).\n"
        "Try: memory, cpu, paging, boot, ai, shell, groq, version.",
        prompt);
    result.tokens = (int)strlen(result.text) / 4;
    return result;
}

/* ---- Public API ----------------------------------------------------------- */

void inference_set_groq_key(const char *key) {
    strncpy(groq_api_key, key, sizeof(groq_api_key) - 1);
    groq_api_key[sizeof(groq_api_key) - 1] = '\0';
    kprintf("[AI]  Groq API key loaded (%d chars).\n", (int)strlen(groq_api_key));
}

bool inference_init(inference_backend_t backend) {
    active_backend = backend;

    switch (backend) {
        case INFERENCE_BACKEND_GROQ:
            if (!groq_api_key[0]) {
                kprintf("[AI]  GROQ_API_KEY not set — using mock backend.\n");
                kprintf("[AI]  Set key with: inference_set_groq_key(key)\n");
                active_backend = INFERENCE_BACKEND_MOCK;
            } else {
                kprintf("[AI]  Groq backend active. Model: %s\n", GROQ_MODEL);
            }
            engine_ready = true;
            return true;

        case INFERENCE_BACKEND_MOCK:
            engine_ready = true;
            return true;

        case INFERENCE_BACKEND_GGML:
            kprintf("[AI]  GGML backend not yet implemented. Using mock.\n");
            active_backend = INFERENCE_BACKEND_MOCK;
            engine_ready   = true;
            return false;

        default:
            engine_ready = false;
            return false;
    }
}

inference_result_t inference_run(const char *system_ctx, const char *prompt) {
    if (!engine_ready) {
        inference_result_t err = { .success = false, .tokens = 0, .latency_ms = 0 };
        strncpy(err.text, "Inference engine not initialised.", sizeof(err.text) - 1);
        return err;
    }

    switch (active_backend) {
        case INFERENCE_BACKEND_GROQ:
            return groq_infer(system_ctx, prompt);
        case INFERENCE_BACKEND_MOCK:
        default:
            return mock_infer(prompt);
    }
}

const char *inference_backend_name(void) {
    switch (active_backend) {
        case INFERENCE_BACKEND_GROQ: return "Groq (llama-3.3-70b-versatile)";
        case INFERENCE_BACKEND_MOCK: return "Mock (rule-based fallback)";
        case INFERENCE_BACKEND_GGML: return "GGML (local LLM)";
        default:                     return "Unknown";
    }
}

bool inference_is_ready(void) { return engine_ready; }
