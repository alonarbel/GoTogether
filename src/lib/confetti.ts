import confetti from 'canvas-confetti'

const COLORS = ['#d4a256', '#e8c58a', '#f2f1ec', '#9b9a93', '#b8862e', '#fafaf7']

export function fireConfetti(opts?: { from?: 'center' | 'button'; element?: HTMLElement | null }) {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 1,
    decay: 0.94,
    startVelocity: 30,
    colors: COLORS,
    shapes: ['circle' as const, 'square' as const],
    scalar: 1.1,
  }

  let origin: { x: number; y: number } = { x: 0.5, y: 0.5 }
  if (opts?.from === 'button' && opts.element) {
    const rect = opts.element.getBoundingClientRect()
    origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    }
  }

  function fire(particleRatio: number, opts2: confetti.Options) {
    confetti({
      ...defaults,
      ...opts2,
      particleCount: Math.floor(180 * particleRatio),
      origin,
    })
  }

  fire(0.25, { spread: 26, startVelocity: 55 })
  fire(0.20, { spread: 60 })
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
  fire(0.10, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
  fire(0.10, { spread: 120, startVelocity: 45 })
}
