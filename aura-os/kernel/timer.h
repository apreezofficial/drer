#ifndef TIMER_H
#define TIMER_H

#include <stdint.h>

/* =============================================================================
 * PIT (Programmable Interval Timer) Driver
 * Drives IRQ0 at a configurable frequency. Provides a system tick counter
 * and a busy-wait sleep function.
 * ============================================================================= */

/* Initialise the PIT at the given frequency (Hz) */
void timer_init(uint32_t frequency);

/* Return the number of ticks since boot */
uint64_t timer_get_ticks(void);

/* Return milliseconds since boot */
uint64_t timer_get_ms(void);

/* Busy-wait for approximately ms milliseconds */
void timer_sleep(uint32_t ms);

#endif /* TIMER_H */
