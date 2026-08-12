/**
 * Deterministic PRNG (mulberry32).
 *
 * The demo dataset is generated, not checked in, so it has to be *identical*
 * on every server instance — otherwise two Vercel lambdas would disagree about
 * what an employee's salary is. A fixed seed guarantees that.
 */
export function createRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    /** Integer in [min, max]. */
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    /** Float in [min, max) rounded to `dp`. */
    float: (min: number, max: number, dp = 2) => {
      const v = next() * (max - min) + min
      const f = 10 ** dp
      return Math.round(v * f) / f
    },
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    /** True with probability `p`. */
    chance: (p: number) => next() < p,
    shuffle: <T>(arr: T[]): T[] => {
      const out = [...arr]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
  }
}

export type Rng = ReturnType<typeof createRng>
