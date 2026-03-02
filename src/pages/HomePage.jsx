import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
// import GlobeBackground from "../components/GlobeBackground";
import GalaxyBackground from "../components/GalaxyBackground";
import Hero from "../components/Hero";
import FeaturedDestinations from "../components/FeaturedDestinations";
import ProcessFlow from "../components/ProcessFlow";
import Statistics from "../components/Statistics";
import FinalCTA from "../components/FinalCTA";
import { useAuth } from "../context/AuthContext";

function HomePage() {
  const { user } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAuthChoice, setShowAuthChoice] = useState(false);
  const navbarRef = useRef(null);

  const handleAuthRequired = ({ scrollTop = true } = {}) => {
    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    setShowAuthChoice(true);
  };

  const handleChooseSignup = () => {
    setShowAuthChoice(false);
    setShowSignup(true);
  };

  const handleChooseLogin = () => {
    setShowAuthChoice(false);
    setShowLogin(true);
  };

  const handleCloseAuthChoice = () => {
    setShowAuthChoice(false);
  };

  const handleLoginRequired = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setShowLogin(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55 }}
    >
      <GalaxyBackground />
      <Navbar
        ref={navbarRef}
        showSignup={showSignup}
        onSignupChange={setShowSignup}
        showLogin={showLogin}
        onLoginChange={setShowLogin}
      />
      {showAuthChoice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(4, 10, 18, 0.74)",
            backdropFilter: "blur(6px)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={handleCloseAuthChoice}
        >
          <div
            style={{
              width: "min(440px, 92vw)",
              background: "rgba(8, 18, 32, 0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "28px 22px",
              boxShadow: "0 20px 60px rgba(3, 6, 12, 0.7)",
              color: "#fff",
              textAlign: "center",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: "24px" }}>
              Join Planora AI
            </h3>
            <p
              style={{
                margin: "0 0 20px",
                color: "#b9d7ff",
                lineHeight: 1.5,
              }}
            >
              Sign in or create an account to explore this destination and
              generate your itinerary.
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button className="nav-button" onClick={handleChooseSignup}>
                Create Account
              </button>
              <button className="nav-button" onClick={handleChooseLogin}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
      <Hero />
      <FeaturedDestinations user={user} onAuthRequired={handleAuthRequired} />
      <ProcessFlow user={user} />
      <Statistics />
      <FinalCTA
        user={user}
        onSignup={handleAuthRequired}
        onLogin={handleLoginRequired}
      />
    </motion.div>
  );
}

export default HomePage;
