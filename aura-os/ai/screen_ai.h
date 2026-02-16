#ifndef SCREEN_AI_H
#define SCREEN_AI_H

#include <stdbool.h>

/* =============================================================================
 * AuraOS — Screen AI
 *
 * Provides AI-powered screen analysis triggered by the global hotkey
 * Win + A + O (intercepted at the keyboard driver level).
 *
 * The active application has zero visibility into this — the hotkey is
 * consumed by the kernel before it reaches any userspace process.
 *
 * Flow:
 *   1. Keyboard driver detects Win+A+O chord
 *   2. screen_ai_trigger() is called from the IRQ handler
 *   3. VGA buffer is captured silently
 *   4. Capture + optional user question sent to Groq
 *   5. AI overlay rendered in a reserved screen region
 *   6. Any key dismisses the overlay and restores the screen
 * ============================================================================= */

/* Initialise the screen AI subsystem and register the hotkey handler */
void screen_ai_init(void);

/*
 * Trigger a screen analysis.
 * Called automatically on Win+A+O, or manually from the shell with `aiscreen`.
 * If question is NULL the AI describes what it sees.
 * If question is non-NULL the AI answers the question in context of the screen.
 */
void screen_ai_trigger(const char *question);

/* Returns true if the overlay is currently visible */
bool screen_ai_overlay_active(void);

/* Dismiss the overlay and restore the previous screen contents */
void screen_ai_dismiss(void);

#endif /* SCREEN_AI_H */
