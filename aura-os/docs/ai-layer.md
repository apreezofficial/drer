# AuraOS AI Layer

## Philosophy

Most operating systems treat AI as an application — a process that runs in user space, isolated from the kernel, with no special access to system state. AuraOS inverts this. The AI subsystem runs at kernel privilege level, with direct access to:

- Physical and virtual memory statistics
- System tick counter and uptime
- Interrupt event history
- Keyboard input stream
- All kernel log messages
- (Future) process table, file system, network state

This means the AI can answer questions like *"why is my system slow?"* with actual data, not guesses.

---

## Components

### 1. `ai_core` — The Orchestrator

`ai/ai_core.c` is the central coordinator. It:

- Maintains a **ring buffer** of the last 64 system events
- Collects a **system context snapshot** before every query
- Calls the **inference engine** with context + user prompt
- Returns a structured `ai_result_t` with response, token count, and latency

```c
ai_result_t result = ai_core_query("why is memory usage high?");
kprintf("%s\n", result.response);
```

### 2. `context` — System State Collector

`ai/context.c` builds a structured snapshot of the current system state:

```
[System Context]
  Uptime     : 4823 ms
  Memory     : 131072 KB total, 2048 KB used, 129024 KB free
  Last cmd   : meminfo
  Kernel msg : PMM initialised
```

This snapshot is prepended to every AI prompt so the model always has current system data.

### 3. `inference` — Pluggable Backend

`ai/inference.c` defines the inference abstraction. Three backends are defined:

| Backend  | Status      | Description                              |
|----------|-------------|------------------------------------------|
| `MOCK`   | ✅ Working  | Rule-based keyword matcher, no model needed |
| `GGML`   | 🔜 Planned  | Local quantised LLM via llama.cpp/GGML   |
| `REMOTE` | 🔜 Planned  | HTTP API (requires networking stack)     |

Switching backends requires one line change:

```c
inference_init(INFERENCE_BACKEND_GGML);
```

---

## Event Ring Buffer

The AI core tracks system events in a circular buffer of 64 entries. Each event has:

- `type` — keypress, command, syscall, fault, memalloc, custom
- `timestamp_ms` — milliseconds since boot
- `data` — up to 128 bytes of event-specific data

Events are pushed by:
- The shell (every command entered)
- The kernel (faults, memory allocations)
- Any subsystem via `ai_core_push_event(type, data)`

The most recent 5 events are included in every AI context snapshot.

---

## Privacy Model

The AI subsystem is designed with privacy as a first-class concern:

1. **All inference is local** — no data leaves the machine (mock + GGML backends)
2. **Keystrokes are not logged** — only completed commands are pushed to the event ring
3. **No persistent storage** — the event ring is in RAM and cleared on reboot
4. **Opt-in context** — subsystems must explicitly push events; nothing is captured passively

---

## Adding a New AI-Aware Command

Any kernel subsystem can query the AI:

```c
#include "ai/ai_core.h"

// Push context about what just happened
ai_core_push_event(AI_EVENT_FAULT, "page fault at 0xDEADBEEF");

// Ask the AI for help
ai_result_t r = ai_core_query("what caused this page fault?");
kprintf("AI: %s\n", r.response);
```

---

## Future: GGML Integration

When the filesystem is available, the GGML backend will:

1. Load a quantised model (e.g. `llama-3.2-1b-q4.gguf`) from disk
2. Initialise a GGML context with a fixed context window (2048 tokens)
3. Run inference entirely in kernel space using the model weights
4. Stream tokens back to the caller

The model will be small enough to fit in ~1GB RAM — well within the range of any machine running AuraOS.

---

## Future: Natural Language Shell

The long-term goal is to replace the traditional command-line with a natural language interface:

```
aura@os> show me what's using the most memory
  [AuraAI] The kernel heap is using 2MB. The PMM bitmap takes 128KB.
           No user processes are running yet. Total: 2.1MB / 128MB used.

aura@os> make the system faster
  [AuraAI] I can suggest: (1) reduce timer frequency from 1000Hz to 100Hz
           to lower interrupt overhead, (2) enable write-combining for the
           VGA buffer. Want me to apply these changes?
```

This requires the GGML backend and a function-calling interface between the AI and kernel subsystems.
