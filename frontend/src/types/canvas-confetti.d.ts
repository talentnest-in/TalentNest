declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
    startVelocity?: number;
    ticks?: number;
    drift?: number;
    gravity?: number;
    decay?: number;
    flat?: boolean;
  }
  export default function confetti(options?: Options): Promise<void>;
}
