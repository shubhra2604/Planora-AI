import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { generateItinerary } from "../firebase";
import StarBorder from "./StarBorder";
import SplitText from "./SplitText";
import "./featured.css";

import { buildItineraryPathById } from "../utils/itineraryRoute";
import { saveRecentItinerary, createTripId } from "../utils/recentTrips";

const DESTINATIONS = [
  {
    id: "goa",
    name: "Goa",
    tag: "Golden Beaches",
    description: "Pristine beaches, vibrant nightlife, Portuguese heritage.",
    color: "#74b9ff",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80&auto=format&fit=crop",
    gradient: "135deg, rgba(116,185,255,0.28) 0%, rgba(116,185,255,0.06) 100%",
  },
  {
    id: "dubai",
    name: "Dubai",
    tag: "Luxury Escapes",
    description: "Modern marvels, desert safaris, world-class shopping.",
    color: "#ff8b8b",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80&auto=format&fit=crop",
    gradient: "135deg, rgba(255,139,139,0.28) 0%, rgba(255,139,139,0.06) 100%",
  },
  {
    id: "jaipur",
    name: "Jaipur",
    tag: "Royal Heritage",
    description: "Pink City palaces, vibrant bazaars, cultural treasures.",
    color: "#f49fae",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80&auto=format&fit=crop",
    gradient: "135deg, rgba(255,179,193,0.28) 0%, rgba(255,179,193,0.06) 100%",
  },
  {
    id: "thailand",
    name: "Thailand",
    tag: "Island Paradise",
    description: "Turquoise waters, island hops, street food heaven.",
    color: "#7effc3",
    image:
      "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=600&q=80&auto=format&fit=crop",
    gradient: "135deg, rgba(126,255,195,0.22) 0%, rgba(126,255,195,0.05) 100%",
  },
  {
    id: "bali",
    name: "Bali",
    tag: "Tropical Bliss",
    description: "Ancient temples, rice fields, zen retreats.",
    color: "#b28bff",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80&auto=format&fit=crop",
    gradient: "135deg, rgba(178,139,255,0.28) 0%, rgba(178,139,255,0.06) 100%",
  },
  {
    id: "kerala",
    name: "Kerala",
    tag: "Backwaters & Spice",
    description: "Houseboat cruises, lush plantations, serene backwaters.",
    color: "#fffa61",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80&auto=format&fit=crop",
    gradient: "135deg, rgba(124,200,255,0.24) 0%, rgba(124,200,255,0.06) 100%",
  },
];

const DESTINATION_STYLE = {
  goa: "Relaxed",
  dubai: "Luxury",
  jaipur: "Family",
  thailand: "Adventure",
  bali: "Couple",
  kerala: "Relaxed",
};

function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultTripDates() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 21);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 3);

  return {
    startDate: formatDateForApi(startDate),
    endDate: formatDateForApi(endDate),
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 50, damping: 20 },
  },
};

function DestinationCard({ dest, isLoading, onExplore }) {
  return (
    <motion.div variants={itemVariants}>
      <StarBorder
        as="div"
        className="dest-star-border"
        color={dest.color}
        speed="5s"
        thickness={1.2}
      >
        <div
          className={`dest-card ${isLoading ? "dest-card--loading" : ""}`}
          style={{ "--accent": dest.color, "--card-gradient": dest.gradient }}
        >
          {/* Image header strip */}
          <div className="dest-card-header">
            <img
              className="dest-card-img"
              src={dest.image}
              alt={dest.name}
              loading="lazy"
              draggable={false}
            />
            <div className="dest-card-glow" />
          </div>

          <div className="dest-card-body">
            <div className="dest-name">
              <SplitText
                text={dest.name}
                tag="span"
                splitType="chars"
                delay={40}
                duration={0.45}
                ease="power3.out"
                from={{ opacity: 0, y: 14 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.12}
                rootMargin="-30px"
              />
            </div>
            <div className="dest-tag">{dest.tag}</div>
            <p className="dest-description">{dest.description}</p>
            <button
              className="dest-cta magnetic"
              type="button"
              disabled={isLoading}
              onClick={() => onExplore(dest)}
              aria-live="polite"
            >
              {isLoading ? (
                <>
                  <span className="dest-cta-spinner" aria-hidden="true" />
                  Generating…
                </>
              ) : (
                <>Explore &rarr;</>
              )}
            </button>
          </div>
        </div>
      </StarBorder>
    </motion.div>
  );
}

export default function FeaturedDestinations({ user, onAuthRequired }) {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingDestination, setGeneratingDestination] = useState(null);
  const cancelledRef = useRef(false);

  const handleExplore = async (destination) => {
    // Check if user is authenticated
    if (!user) {
      onAuthRequired?.();
      return;
    }

    if (generating) return;
    setApiError("");
    cancelledRef.current = false;
    setGenerating(true);
    setGeneratingDestination(destination);

    const { startDate, endDate } = getDefaultTripDates();

    try {
      const result = await generateItinerary({
        destination: destination.name,
        startDate,
        endDate,
        travelers: 2,
        style: DESTINATION_STYLE[destination.id] || "Relaxed",
      });

      if (!result?.data?.itinerary) {
        throw new Error("No itinerary received from server.");
      }

      const itineraryWithMeta = {
        ...result.data.itinerary,
        travelers: 2,
        requestedBudget: null,
      };

      // If user stopped generation, discard result entirely
      if (cancelledRef.current) return;

      // Save if user is signed in (don't block the UI)
      if (user) {
        saveRecentItinerary(user, itineraryWithMeta).catch((e) =>
          console.error("Failed to save itinerary after navigate:", e),
        );
      }

      // Compute tripId from the real itinerary
      const tripId = createTripId(itineraryWithMeta);
      navigate(buildItineraryPathById(tripId), {
        state: { itinerary: itineraryWithMeta },
      });
    } catch (error) {
      console.error("Itinerary generation failed:", error);
      setApiError(error?.message || "Request timed out. Please try again.");
    } finally {
      setGenerating(false);
      setGeneratingDestination(null);
    }
  };

  const handleStop = () => {
    cancelledRef.current = true;
    setGenerating(false);
    setGeneratingDestination(null);
  };

  return (
    <motion.section
      className="featured"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      <div className="featured-inner">
        <motion.div variants={itemVariants}>
          <SplitText
            text="Featured Destinations"
            tag="h3"
            splitType="chars"
            delay={60}
            duration={0.6}
            ease="power3.out"
            from={{ opacity: 0, y: 26 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.15}
            rootMargin="-40px"
            className="featured-split-heading"
          />
        </motion.div>
        {generating && (
          <div
            className="featured-loading-overlay"
            role="status"
            aria-live="polite"
          >
            <div className="featured-loader-orb" aria-hidden="true" />
            <div className="featured-loading-text">
              Generating itinerary for <b>{generatingDestination?.name}</b>...
            </div>
            <div className="featured-loading-subtext">
              Please wait, this may take a few seconds
              <span className="featured-loading-dots" aria-hidden="true">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
            <button
              className="featured-stop-btn"
              type="button"
              onClick={handleStop}
              aria-label="Stop generating"
            >
              ✕ Stop
            </button>
          </div>
        )}
        <div
          className={`destination-grid ${generating ? "is-generating" : ""}`}
        >
          {DESTINATIONS.map((dest) => (
            <DestinationCard
              key={dest.id}
              dest={dest}
              isLoading={generating && generatingDestination?.id === dest.id}
              onExplore={handleExplore}
            />
          ))}
        </div>
        {apiError && <div className="featured-error">{apiError}</div>}
      </div>
    </motion.section>
  );
}
