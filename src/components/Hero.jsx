import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ShinyText from "./ShinyText";
import TextType from "./TextType";
import ElectricBorder from "./ElectricBorder";
// import GlobeBackground from "./GlobeBackground"; // Disabled: Galaxy background used instead
import {
  ANIMATION_DURATIONS,
  ANIMATION_DELAYS,
  SCROLL_THRESHOLD,
  SCROLL_HINT_DISTANCE,
  SCROLL_HINT_MIN,
} from "../constants/animation";
import "./hero.css";
import { useAuth } from "../context/AuthContext";

export default function Hero() {
  const { user, authLoading } = useAuth();
  const heroRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(
    () => window.localStorage.getItem("tp_scroll_hint_seen") !== "1",
  );

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        setShowScrollHint(false);
        window.localStorage.setItem("tp_scroll_hint_seen", "1");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollHintClick = () => {
    setShowScrollHint(false);
    window.localStorage.setItem("tp_scroll_hint_seen", "1");
    window.scrollBy({
      top: Math.max(window.innerHeight * SCROLL_HINT_DISTANCE, SCROLL_HINT_MIN),
      behavior: "smooth",
    });
  };

  const handleStartPlanningClick = () => {
    const plannerSection =
      document.getElementById("planner") ||
      document.querySelector(".scroll-section.scroll-planner");

    if (plannerSection) {
      plannerSection.classList.add("visible");
      plannerSection.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", "#planner");
      return;
    }

    window.location.hash = "planner";
  };

  const userName = user?.displayName || "Traveler";
  const isAuthLoading = Boolean(authLoading);
  const showPersonalGreeting = Boolean(user && !authLoading);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-left">
        <motion.div
          className="hero-depth"
          initial={{ opacity: 0, y: 38, rotateX: 12 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.58, ease: "easeOut" }}
          whileHover={{ y: -8 }}
        >
          <motion.h1
            className="hero-gradient-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: ANIMATION_DURATIONS.slow,
              ease: "easeOut",
              delay: ANIMATION_DELAYS.short,
            }}
          >
            <span className="hero-title-line">Explore the World</span>
            <span className="hero-title-line hero-title-emphasis">
              Effortlessly
            </span>
          </motion.h1>

          <motion.div
            className="hero-subheading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: ANIMATION_DELAYS.medium,
              duration: ANIMATION_DURATIONS.normal,
            }}
          >
            {showPersonalGreeting && (
              <span className="hero-username">{userName}</span>
            )}
            <TextType
              key={
                showPersonalGreeting ? user.uid : user ? "auth-loading" : "anon"
              }
              text={
                showPersonalGreeting
                  ? ", your next adventure starts here."
                  : isAuthLoading
                    ? "Loading..."
                    : "Your next adventure starts here."
              }
              as="span"
              className="hero-subheading-typed"
              typingSpeed={isAuthLoading ? 30 : 45}
              initialDelay={showPersonalGreeting ? 120 : 800}
              loop={false}
              showCursor={false}
            />
          </motion.div>

          <motion.p
            className="hero-desc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: ANIMATION_DELAYS.longer,
              duration: ANIMATION_DURATIONS.normal,
            }}
          >
            <ShinyText
              speed={2}
              color="#b5b5b5"
              shineColor="#ffffff"
              spread={120}
              className="hero-shiny-desc"
            >
              Smart itineraries, real-time budgets, and personalized routes
              powered by AI.
            </ShinyText>
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: ANIMATION_DELAYS.long,
              duration: ANIMATION_DURATIONS.normal,
              type: "spring",
              stiffness: 120,
              damping: 18,
            }}
          >
            <ElectricBorder
              color="#b19eef"
              speed={1.2}
              chaos={0.15}
              borderRadius={999}
              className="hero-electric-btn"
            >
              <motion.button
                type="button"
                className="btn-primary-electric"
                onClick={handleStartPlanningClick}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Planning
              </motion.button>
            </ElectricBorder>
          </motion.div>
        </motion.div>
      </div>
      {showScrollHint && (
        <motion.button
          type="button"
          className="hero-scroll-hint"
          aria-label="Scroll down to explore more sections"
          onClick={handleScrollHintClick}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: ANIMATION_DURATIONS.normal,
            ease: "easeOut",
            delay: ANIMATION_DELAYS.longest,
          }}
        >
          <span>Scroll to explore</span>
          <span className="hero-scroll-arrow" aria-hidden="true">
            ↓
          </span>
        </motion.button>
      )}
    </section>
  );
}
