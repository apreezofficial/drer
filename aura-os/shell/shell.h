#ifndef SHELL_H
#define SHELL_H

/* =============================================================================
 * AuraOS Shell
 * Interactive command-line interface. Runs in the kernel after all subsystems
 * are initialised. Supports built-in commands and AI queries.
 * ============================================================================= */

/* Start the interactive shell — does not return */
void shell_run(void);

#endif /* SHELL_H */
