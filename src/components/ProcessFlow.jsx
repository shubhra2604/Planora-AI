import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import "./processflow.css";

const STEPS = [
  {
    id: 1,
    icon: "idea",
    iconGradient: "linear-gradient(135deg, #2ea8ff, #23b4e8)",
    title: "Tell me where you want to go",
    description: "Enter your destination, dates, budget & travel style",
  },
  {
    id: 2,
    icon: "profile",
    iconGradient: "linear-gradient(135deg, #9b52ff, #ec4ea1)",
    title: "I will plan your perfect itinerary",
    description: "I will create a personalized day-by-day plan",
  },
  {
    id: 3,
    icon: "zap",
    iconGradient: "linear-gradient(135deg, #22c1a1, #1cc7c8)",
    title: "Customize to your style",
    description: "Swap activities, adjust timings, add your favorites",
  },
  {
    id: 4,
    icon: "rocket",
    iconGradient: "linear-gradient(135deg, #4da6ff, #6fb8ff)",
    title: "Book & travel!",
    description: "One-click booking integration for hotels & flights",
  },
];

function StepIcon({ type }) {
  if (type === "idea") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 18h6M10 21h4M8.5 14.8c-1.4-1-2.5-2.7-2.5-4.8a6 6 0 1 1 12 0c0 2.1-1.1 3.8-2.5 4.8-.5.4-.8 1-.8 1.6V17H9.3v-.6c0-.6-.3-1.2-.8-1.6Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "profile") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M4 20a8 8 0 0 1 16 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "zap") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M13 2 5 13h6l-1 9 9-13h-6l0-7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "rocket") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2.75 12 21 4.5 13.5 21l-3-6-7.75-3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.5 15 21 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 13c0-3.6 2.9-6.5 6.5-6.5H14l2.5-2.5v2.5H18a2 2 0 0 1 2 2v1.5a2 2 0 0 1-2 2h-1.5v2.5L14 13h-3.5C6.9 13 4 15.9 4 19.5V20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProcessFlow() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 18,
    restDelta: 0.001,
  });

  return (
    <section className="process-flow" ref={sectionRef}>
      <motion.div
        className="process-container"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        <div className="process-header">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Your journey from wanderlust to booked trip in 4 simple steps
          </motion.p>
        </div>

        <div className="steps-wrapper">
          {/* Animated connecting line */}
          <div className="connecting-line">
            <motion.div
              className="line-progress"
              style={{ scaleX, originX: 0 }}
            />
          </div>

          <div className="steps-grid">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.id}
                className="step-card"
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.55,
                  delay: idx * 0.12,
                  type: "spring",
                  stiffness: 120,
                  damping: 18,
                }}
                whileHover={{ scale: 1.05, zIndex: 10, rotateY: 5 }}
              >
                <motion.div
                  className="step-number-circle"
                  style={{ "--icon-gradient": step.iconGradient }}
                  whileHover={{ rotate: [0, -4, 3, 0], scale: 1.08 }}
                  transition={{
                    duration: 0.6,
                    type: "spring",
                    stiffness: 120,
                    damping: 18,
                  }}
                >
                  <motion.div
                    className="step-icon"
                    whileHover={{ rotateY: 14, scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  >
                    <StepIcon type={step.icon} />
                  </motion.div>
                </motion.div>

                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>

                {/* Arrow to next step (except last) */}
                {idx < STEPS.length - 1 && (
                  <motion.div
                    className="step-arrow"
                    animate={{ y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA removed */}
      </motion.div>
    </section>
  );
}
