/* =============================================================================
 * AuraOS — PIT Timer Driver
 * Programs the 8253/8254 PIT channel 0 to fire IRQ0 at a given frequency.
 * ============================================================================= */

#include "timer.h"
#include "isr.h"
#include "../lib/stdio.h"

/* PIT I/O ports */
#define PIT_CHANNEL0    0x40
#define PIT_COMMAND     0x43
#define PIT_BASE_FREQ   1193182     /* Hz — PIT oscillator frequency */

static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile ("outb %0, %1" : : "a"(val), "Nd"(port));
}

static volatile uint64_t tick_count = 0;
static uint32_t          tick_freq  = 0;

/* IRQ0 handler — increments the tick counter */
static void timer_irq_handler(registers_t *regs) {
    (void)regs;
    tick_count++;
}

void timer_init(uint32_t frequency) {
    tick_freq = frequency;

    /* Calculate the divisor: PIT fires at BASE_FREQ / divisor */
    uint32_t divisor = PIT_BASE_FREQ / frequency;

    /* Command: channel 0, lobyte/hibyte, rate generator */
    outb(PIT_COMMAND, 0x36);
    outb(PIT_CHANNEL0, (uint8_t)(divisor & 0xFF));
    outb(PIT_CHANNEL0, (uint8_t)((divisor >> 8) & 0xFF));

    /* Register our IRQ0 handler */
    irq_register_handler(0, timer_irq_handler);
}

uint64_t timer_get_ticks(void) {
    return tick_count;
}

uint64_t timer_get_ms(void) {
    if (tick_freq == 0) return 0;
    return (tick_count * 1000) / tick_freq;
}

void timer_sleep(uint32_t ms) {
    uint64_t target = timer_get_ms() + ms;
    while (timer_get_ms() < target) {
        __asm__ volatile ("hlt");   /* Sleep until next interrupt */
    }
}
