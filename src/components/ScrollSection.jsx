import { motion } from "framer-motion";
import "./scrollSection.css";

export default function ScrollSection({ children, variant = "default", id }) {
  const className =
    variant === "planner-zoom"
      ? "scroll-section scroll-planner"
      : "scroll-section";

  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 60, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
      onViewportEnter={(entry) => {
        entry.target.classList.add("visible");
      }}
    >
      {children}
    </motion.section>
  );
}
