/**
 * Animaciones centralizadas del sistema
 * Utilidades reutilizables para micro-interacciones premium
 */

import { Variants, Transition } from "framer-motion"

// Transiciones base
export const transitions = {
  fast: { duration: 0.12, ease: [0.4, 0, 0.2, 1] } as Transition,
  normal: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } as Transition,
  slow: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } as Transition,
  page: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } as Transition,
}

// Fade In
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.normal,
  },
}

// Slide Up
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
}

// Slide Down
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
}

// Scale Hover
export const scaleHover: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: transitions.fast,
  },
  tap: {
    scale: 0.98,
    transition: transitions.fast,
  },
}

// Page Transition
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.page,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: transitions.fast,
  },
}

// Stagger Container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
}

// Stagger Item
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
}

// Card Hover
export const cardHover: Variants = {
  rest: {
    y: 0,
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  },
  hover: {
    y: -2,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    transition: transitions.fast,
  },
}

// Drawer Slide
export const drawerSlide: Variants = {
  hidden: {
    x: "100%",
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: transitions.fast,
  },
}

// Backdrop Fade
export const backdropFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.fast,
  },
  exit: {
    opacity: 0,
    transition: transitions.fast,
  },
}

// Success Animation
export const successAnimation: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 300,
    },
  },
}

// Highlight Pulse
export const highlightPulse: Variants = {
  initial: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  animate: {
    backgroundColor: [
      "rgba(37, 99, 235, 0.1)",
      "rgba(37, 99, 235, 0.2)",
      "rgba(37, 99, 235, 0.1)",
    ],
    transition: {
      duration: 1.5,
      ease: "easeInOut",
    },
  },
}

// Badge Appear
export const badgeAppear: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
}
