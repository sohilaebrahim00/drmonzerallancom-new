import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
  as?: "div" | "li";
  /**
   * How far the element travels, in px. The 28px default is the site's
   * existing behaviour; a smaller value is for places that want the movement
   * to be barely perceptible rather than noticed.
   *
   * NOTE for the RTL work: `direction` "left"/"right" move along the X axis
   * and are therefore PHYSICAL, not logical — they will travel the wrong way
   * in an RTL layout. "up"/"down" are direction-neutral and safe.
   */
  distance?: number;
}

function offsetFor(direction: Direction, distance: number): { x?: number; y?: number } {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
}

export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.25,
  as = "div",
  distance = 28,
}: RevealProps) {
  /**
   * `prefers-reduced-motion` is a stated medical need for some visitors —
   * vestibular disorders make travelling content genuinely unpleasant — so it
   * is honoured here rather than per call site. The content still appears; it
   * just appears rather than arrives.
   *
   * Note this must not degrade to "hidden forever": the element still has to
   * end at opacity 1, so the reduced variant is a no-op transition, not a
   * removed animation.
   */
  const reduceMotion = useReducedMotion();

  const variants: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1, transition: { duration: 0 } } }
    : {
        hidden: { opacity: 0, ...offsetFor(direction, distance) },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration, delay, ease: [0.22, 1, 0.36, 1] },
        },
      };

  const MotionTag = as === "li" ? motion.li : motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
