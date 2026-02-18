/**
 * Premium Animation System
 * Motion philosophy: Guide attention + imply competence
 * Never "for fun", always "for meaning"
 */

export const motionConfig = {
  // Page transitions (200-280ms for premium feel)
  pageTransition: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: {
      duration: 0.24, // 240ms - premium precision
      ease: [0.25, 0.1, 0.25, 1], // ease-in-out
    },
  },

  // Hero headline reveal (slow opacity ramp)
  heroReveal: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  },

  // Scroll reveal (subtle)
  scrollReveal: {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },

  // Stagger for lists/cards
  staggerContainer: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  },

  staggerItem: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  },

  // Hover lift (subtle)
  hoverLift: {
    whileHover: {
      y: -2,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  },

  // Tile veil transition
  tileVeil: {
    initial: { scale: 1, opacity: 1 },
    animate: { scale: 1.05, opacity: 0.95 },
    exit: { scale: 1.1, opacity: 0 },
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Stagger delays (60-90ms between items)
export const getStaggerDelay = (index: number, baseDelay = 0.06) => ({
  transition: {
    delay: index * baseDelay,
  },
});
