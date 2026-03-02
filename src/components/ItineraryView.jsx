// ...existing code...
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePDF } from "../firebase";
import { submitItineraryFeedback } from "../utils/feedback";
// ...existing code...
import "./itinerary.css";
import React from "react";

function ItineraryView({ itinerary, onBack, user }) {
  // Fix: Add missing state for shareStatus and manualShareLink
  const [shareStatus] = useState("");
  const [manualShareLink] = useState("");
  const manualLinkRef = useRef(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeDay, setActiveDay] = useState(1);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [expandedInModal, setExpandedInModal] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackHometown, setFeedbackHometown] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState({
    type: "",
    message: "",
  });
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  // ...existing code...

  useEffect(() => {
    // Set page title
    if (itinerary?.title) {
      document.title = `${itinerary.title} - Planora AI`;
    }

    return () => {
      document.title = "Planora AI - AI-Powered Travel Itinerary Planner";
    };
  }, [itinerary]);

  // Scroll to top when changing tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Scroll to top when changing days
  const handleDayChange = (day) => {
    setActiveDay(day);
    const tabContent = document.querySelector(".tab-content");
    if (tabContent) {
      tabContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getBookingSearchUrl = (destination, checkIn, checkOut) => {
    const dest = encodeURIComponent(destination);
    const checkin = checkIn ? `&checkin=${checkIn}` : "";
    const checkout = checkOut ? `&checkout=${checkOut}` : "";
    return `https://www.booking.com/searchresults.html?ss=${dest}${checkin}${checkout}`;
  };

  const getAgodaSearchUrl = (destination) => {
    const dest = encodeURIComponent(destination);
    return `https://www.agoda.com/search?city=${dest}`;
  };

  const getMakeMyTripUrl = (destination) => {
    const dest = encodeURIComponent(destination);
    return `https://www.makemytrip.com/hotels/hotel-listing/?city=${dest}`;
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);

      const result = await generatePDF({ itinerary });

      if (result.data.ok && result.data.pdf) {
        // Convert base64 to blob
        const byteCharacters = atob(result.data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename || "itinerary.pdf";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  // ...existing code...

  const openCardModal = (cardName) => {
    setExpandedInModal(cardName);
  };

  const closeCardModal = () => {
    setExpandedInModal(null);
  };

  const openFeedbackModal = () => {
    setFeedbackStatus({ type: "", message: "" });
    setIsFeedbackModalOpen(true);
  };

  const closeFeedbackModal = () => {
    if (submittingFeedback) return;
    setIsFeedbackModalOpen(false);
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();

    if (!feedbackText.trim()) {
      setFeedbackStatus({
        type: "error",
        message: "Please share a quick note before submitting feedback.",
      });
      return;
    }

    if (!feedbackHometown.trim()) {
      setFeedbackStatus({
        type: "error",
        message: "Please add your home town.",
      });
      return;
    }

    try {
      setSubmittingFeedback(true);
      setFeedbackStatus({ type: "", message: "" });

      await submitItineraryFeedback({
        user,
        itinerary,
        rating: feedbackRating,
        feedback: feedbackText,
        hometown: feedbackHometown,
      });

      setFeedbackText("");
      setFeedbackRating(5);
      setFeedbackHometown("");
      setFeedbackStatus({
        type: "success",
        message: "Thanks! Your feedback has been submitted.",
      });
      setIsFeedbackModalOpen(false);
    } catch (error) {
      setFeedbackStatus({
        type: "error",
        message:
          error?.message || "Could not submit feedback. Please try again.",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const mustTryFoodsFromItinerary = Array.isArray(itinerary.mustTryFoods)
    ? itinerary.mustTryFoods.filter(Boolean)
    : [];
  const highlightsList = Array.isArray(itinerary.highlights)
    ? itinerary.highlights.filter(Boolean)
    : typeof itinerary.highlights === "string"
      ? itinerary.highlights
          .split(/\r?\n|\.|;|,/) // split on newlines or common separators
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  // Normalize: if a restaurant entry is a string, convert to object
  const displayedRestaurants = (
    Array.isArray(itinerary.restaurants) ? itinerary.restaurants : []
  )
    .map((r) => {
      if (typeof r === "string") {
        return {
          name: r.split("(")[0].trim() || r,
          cuisine: "Local",
          priceRange: "Varies",
          rating: 4.0,
          speciality: r,
          location: itinerary.destination || "",
          bestFor: "Dining",
          tipForVisit: "",
        };
      }
      if (!r || typeof r !== "object") return null;
      return r;
    })
    .filter(Boolean)
    .slice(0, 6);
  const mustTryFoods = mustTryFoodsFromItinerary.length
    ? mustTryFoodsFromItinerary
    : (Array.isArray(itinerary.restaurants)
        ? itinerary.restaurants.map((restaurant) => restaurant.speciality)
        : []
      )
        .filter(Boolean)
        .slice(0, 8);

  const extractInrNumbers = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return [value];
    if (typeof value !== "string") return [];

    const matches = value.match(/\d[\d,]*/g) || [];
    return matches
      .map((chunk) => Number(chunk.replace(/,/g, "")))
      .filter((amount) => Number.isFinite(amount) && amount > 0);
  };

  const parseInrAmount = (value) => {
    const amounts = extractInrNumbers(value);
    if (!amounts.length) return null;
    return Math.min(...amounts);
  };

  const formatInr = (amount) => `₹${amount.toLocaleString("en-IN")}`;

  const formatPrice = (value) => {
    const amounts = extractInrNumbers(value);
    if (!amounts.length) return value || "Price on request";

    const hasRangeHint =
      typeof value === "string" && /(?:-|–|—|\bto\b)/i.test(value);

    if (hasRangeHint && amounts.length >= 2) {
      const [first, second] = amounts;
      if (first === second) return formatInr(first);
      return `${formatInr(first)} - ${formatInr(second)}`;
    }

    return formatInr(amounts[0]);
  };

  const formatHotelNightlyPrice = (value) => {
    const basePrice = formatPrice(value);
    if (!basePrice || basePrice === "Price on request")
      return "Price on request";

    const hasNightContext =
      typeof value === "string" &&
      /(?:\/\s*night|per\s*night|nightly)/i.test(value);

    return hasNightContext ? `${basePrice} per night` : `${basePrice}/night`;
  };

  const safe = (v, fallback = "") => v || fallback;

  const stayNights = Math.max((itinerary.days?.length || 1) - 1, 1);
  const requestedBudgetAmount = parseInrAmount(itinerary.requestedBudget);
  const targetHotelBudgetPerNight = requestedBudgetAmount
    ? Math.round((requestedBudgetAmount * 0.35) / stayNights)
    : null;

  // Normalize: if a hotel entry is a string, convert to object
  const normalizedHotels = (
    Array.isArray(itinerary.hotels) ? itinerary.hotels : []
  )
    .map((hotel) => {
      if (typeof hotel === "string") {
        return {
          name: hotel.split("(")[0].trim() || hotel,
          type: "Hotel",
          pricePerNight: "Price on request",
          location: itinerary.destination || "",
          amenities: "",
          bookingUrl: "https://www.booking.com",
        };
      }
      if (!hotel || typeof hotel !== "object") return null;
      return hotel;
    })
    .filter(Boolean);

  const hotelsWithPrice = normalizedHotels.map((hotel) => ({
    ...hotel,
    numericPrice: parseInrAmount(hotel.pricePerNight),
  }));

  const budgetMatchedHotels = targetHotelBudgetPerNight
    ? hotelsWithPrice.filter(
        (hotel) =>
          hotel.numericPrice &&
          hotel.numericPrice <= targetHotelBudgetPerNight * 1.15,
      )
    : hotelsWithPrice;

  const recommendedHotels =
    budgetMatchedHotels.length > 0
      ? budgetMatchedHotels
      : [...hotelsWithPrice]
          .sort((a, b) => {
            if (!a.numericPrice && !b.numericPrice) return 0;
            if (!a.numericPrice) return 1;
            if (!b.numericPrice) return -1;
            return a.numericPrice - b.numericPrice;
          })
          .slice(0, 6);

  const tabs = [
    { id: "overview", label: "📋 Overview" },
    { id: "itinerary", label: "🗓️ Day by Day" },
    { id: "hotels", label: "🏨 Hotels" },
    { id: "restaurants", label: "🍽️ Restaurants" },
    { id: "map", label: "🗺️ Map" },
  ];

  const overviewCardCount =
    2 +
    (itinerary.weatherInfo ? 1 : 0) +
    (itinerary.transportInfo ? 1 : 0) +
    (itinerary.packingList ? 1 : 0);

  return (
    <>
      <div className="itinerary-container">
        <motion.div
          className="itinerary-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="itinerary-header">
            <motion.button
              className="back-btn"
              onClick={onBack}
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back to Planner
            </motion.button>
            {/* Delete button removed as requested */}
            <div className="header-actions">
              {/* Share link button removed */}
              <motion.button
                className="action-btn"
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {downloadingPDF ? "⏳ Generating..." : "📄 Download PDF"}
              </motion.button>
              <motion.button
                className="action-btn"
                type="button"
                onClick={openFeedbackModal}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Send Feedback
              </motion.button>
            </div>
          </div>

          {shareStatus && (
            <div style={{ color: "#b7c9e7", marginTop: 8, marginBottom: 4 }}>
              {shareStatus}
            </div>
          )}
          {manualShareLink && (
            <div
              style={{
                margin: "8px 0 16px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <label
                htmlFor="manual-share-link"
                style={{
                  color: "#b7c9e7",
                  fontSize: "0.98rem",
                  marginBottom: 2,
                }}
              >
                Shareable Link:
              </label>
              <input
                id="manual-share-link"
                ref={manualLinkRef}
                value={manualShareLink}
                readOnly
                style={{
                  width: "100%",
                  maxWidth: 420,
                  fontSize: "1rem",
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: "1px solid #3a8cff",
                  background: "#101c2b",
                  color: "#f5f9ff",
                  marginBottom: 2,
                }}
                onFocus={(e) => e.target.select()}
              />
            </div>
          )}

          {/* Show generating banner when placeholder itinerary navigated to */}
          {itinerary?.status === "generating" && (
            <div
              style={{
                margin: "12px 0",
                padding: "10px 14px",
                borderRadius: 8,
                background:
                  "linear-gradient(90deg, rgba(14,36,56,0.6), rgba(13,29,46,0.6))",
                color: "#dbeeff",
                border: "1px solid rgba(58,140,255,0.12)",
                boxShadow: "0 6px 20px rgba(2,10,25,0.35)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 18 }}>⏳</div>
              <div style={{ fontSize: 14 }}>
                Generating itinerary — fetching suggestions. You will be
                redirected and the page will update when ready.
              </div>
            </div>
          )}

          <motion.div
            className="itinerary-hero"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1>
              {(() => {
                // Remove any (Day ... to ...) suffix from the title
                const title = itinerary.title?.replace(/\(Day.*?\)/, "").trim();
                return title;
              })()}
              {itinerary.days && itinerary.days.length > 0 && (
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: "1.1rem",
                    marginLeft: 8,
                    color: "#A4B9FF",
                  }}
                >
                  (Day 1 to {itinerary.days.length})
                </span>
              )}
            </h1>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-label">Duration</span>
                <span className="stat-value">
                  {itinerary.days?.length} Days
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Destination</span>
                <span className="stat-value">{itinerary.destination}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Est. Budget</span>
                <span className="stat-value">
                  {itinerary.estimatedTotalCost}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="itinerary-tabs">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => handleTabChange(tab.id)}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.span
                    className="tab-underline"
                    layoutId="tabUnderline"
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                className="tab-content"
                key="overview"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="overview-grid"
                  style={{ "--overview-columns": overviewCardCount }}
                >
                  <motion.div
                    className="overview-card"
                    onClick={() => openCardModal("highlights")}
                    whileHover={{ scale: 1.02, translateY: -5 }}
                  >
                    <h3>✨ Must-See Highlights</h3>
                    <p className="card-preview">Click to expand...</p>
                  </motion.div>

                  <motion.div
                    className="overview-card"
                    onClick={() => openCardModal("tips")}
                    whileHover={{ scale: 1.02, translateY: -5 }}
                  >
                    <h3>💡 Travel Tips</h3>
                    <p className="card-preview">Click to expand...</p>
                  </motion.div>

                  {itinerary.weatherInfo && (
                    <motion.div
                      className="overview-card"
                      onClick={() => openCardModal("weather")}
                      whileHover={{ scale: 1.02, translateY: -5 }}
                    >
                      <h3>🌤️ Weather Info</h3>
                      <p className="card-preview">Click to expand...</p>
                    </motion.div>
                  )}

                  {itinerary.transportInfo && (
                    <motion.div
                      className="overview-card"
                      onClick={() => openCardModal("transport")}
                      whileHover={{ scale: 1.02, translateY: -5 }}
                    >
                      <h3>🚗 Transport</h3>
                      <p className="card-preview">Click to expand...</p>
                    </motion.div>
                  )}

                  {itinerary.packingList && (
                    <motion.div
                      className="overview-card"
                      onClick={() => openCardModal("packing")}
                      whileHover={{ scale: 1.02, translateY: -5 }}
                    >
                      <h3>🎒 Packing Essentials</h3>
                      <p className="card-preview">Click to expand...</p>
                    </motion.div>
                  )}
                </div>

                <AnimatePresence>
                  {expandedInModal && (
                    <motion.div
                      className="card-modal-overlay"
                      onClick={closeCardModal}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="card-modal"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <div className="card-modal-header">
                          <h2>
                            {expandedInModal === "highlights" &&
                              "✨ Must-See Highlights"}
                            {expandedInModal === "tips" && "💡 Travel Tips"}
                            {expandedInModal === "weather" && "🌤️ Weather Info"}
                            {expandedInModal === "transport" && "🚗 Transport"}
                            {expandedInModal === "packing" &&
                              "🎒 Packing Essentials"}
                          </h2>
                          <button
                            className="modal-close-btn"
                            onClick={closeCardModal}
                            aria-label="Close details"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="card-modal-content">
                          {expandedInModal === "highlights" && (
                            <ul className="highlights-list">
                              {highlightsList.map((h, idx) => (
                                <li key={idx}>{h}</li>
                              ))}
                            </ul>
                          )}
                          {expandedInModal === "tips" && (
                            <ul className="tips-list">
                              {itinerary.tips?.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          )}
                          {expandedInModal === "weather" && (
                            <p>{itinerary.weatherInfo}</p>
                          )}
                          {expandedInModal === "transport" && (
                            <>
                              <p>
                                <strong>Type:</strong>{" "}
                                {itinerary.transportInfo.type}
                              </p>
                              <p>
                                <strong>Cost:</strong>{" "}
                                {itinerary.transportInfo.estimatedCost}
                              </p>
                              <p className="transport-tip">
                                {itinerary.transportInfo.bookingTip}
                              </p>
                            </>
                          )}
                          {expandedInModal === "packing" && (
                            <ul className="packing-list">
                              {itinerary.packingList.map((item, idx) => (
                                <li key={idx}>✓ {item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === "itinerary" && (
              <motion.div
                className="tab-content"
                key="itinerary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="day-selector">
                  {itinerary.days?.map((day, idx) => (
                    <motion.button
                      key={idx + 1}
                      className={`day-pill ${activeDay === idx + 1 ? "active" : ""}`}
                      onClick={() => handleDayChange(idx + 1)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Day {idx + 1}
                    </motion.button>
                  ))}
                </div>

                {itinerary.days && itinerary.days[activeDay - 1] && (
                  <motion.div
                    key={activeDay}
                    className="day-detail"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.55,
                      type: "spring",
                      stiffness: 120,
                      damping: 18,
                    }}
                  >
                    <div className="day-header">
                      <h2>
                        Day {activeDay}:{" "}
                        {itinerary.days[activeDay - 1].theme ||
                          itinerary.days[activeDay - 1].title}
                      </h2>
                      <p className="day-date">
                        {itinerary.days[activeDay - 1].date}
                      </p>
                    </div>

                    <div className="activities-timeline">
                      <h3>🎭 Activities</h3>
                      {(() => {
                        const dayObj = itinerary.days[activeDay - 1] || {};
                        const dayActivities = Array.isArray(dayObj.activities)
                          ? dayObj.activities
                          : dayObj.activities
                            ? [dayObj.activities]
                            : [];

                        return dayActivities.map((activity, idx) =>
                          typeof activity === "string" ? (
                            <div key={idx} className="activity-card">
                              <div className="activity-content">
                                <p>{activity}</p>
                              </div>
                            </div>
                          ) : (
                            <div key={idx} className="activity-card">
                              <div className="activity-time">
                                🕐 {activity.time}
                              </div>
                              <div className="activity-content">
                                <h4>{activity.activity}</h4>
                                <p>{activity.description}</p>
                                {activity.location && (
                                  <p className="activity-location">
                                    📍 {activity.location}
                                  </p>
                                )}
                                <p className="activity-cost">
                                  💰 {activity.estimatedCost}
                                </p>
                              </div>
                            </div>
                          ),
                        );
                      })()}
                    </div>

                    {itinerary.days[activeDay - 1].meals && (
                      <div className="meals-section">
                        <h3>🍽️ Meals</h3>
                        <div className="meals-grid">
                          {itinerary.days[activeDay - 1].meals.breakfast && (
                            <div className="meal-card">
                              <span className="meal-icon">🌅</span>
                              <div>
                                <strong>Breakfast</strong>
                                <p>
                                  {
                                    itinerary.days[activeDay - 1].meals
                                      .breakfast
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                          {itinerary.days[activeDay - 1].meals.lunch && (
                            <div className="meal-card">
                              <span className="meal-icon">☀️</span>
                              <div>
                                <strong>Lunch</strong>
                                <p>
                                  {itinerary.days[activeDay - 1].meals.lunch}
                                </p>
                              </div>
                            </div>
                          )}
                          {itinerary.days[activeDay - 1].meals.dinner && (
                            <div className="meal-card">
                              <span className="meal-icon">🌙</span>
                              <div>
                                <strong>Dinner</strong>
                                <p>
                                  {itinerary.days[activeDay - 1].meals.dinner}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {itinerary.days[activeDay - 1].notes && (
                      <div className="day-notes">
                        <h4>📝 Notes</h4>
                        <p>{itinerary.days[activeDay - 1].notes}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "hotels" && (
              <motion.div
                className="tab-content"
                key="hotels"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="hotels-header">
                  <div>
                    <h2>🏨 Recommended Hotels</h2>
                    {targetHotelBudgetPerNight && (
                      <p className="hotel-budget-hint">
                        Matched to your budget around{" "}
                        {formatPrice(targetHotelBudgetPerNight)} per night
                      </p>
                    )}
                  </div>
                  <div className="booking-links">
                    <a
                      href={getBookingSearchUrl(
                        itinerary.destination,
                        itinerary.days?.[0]?.date,
                        itinerary.days?.[itinerary.days.length - 1]?.date,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="booking-link"
                    >
                      Booking.com →
                    </a>
                    <a
                      href={getMakeMyTripUrl(itinerary.destination)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="booking-link"
                    >
                      MakeMyTrip →
                    </a>
                    <a
                      href={getAgodaSearchUrl(itinerary.destination)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="booking-link"
                    >
                      Agoda →
                    </a>
                  </div>
                </div>

                <div className="hotels-grid">
                  {recommendedHotels.map((hotel, idx) => (
                    <motion.div
                      key={idx}
                      className="hotel-card"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.03, y: -5 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="hotel-type">
                        {safe(hotel.type, "Hotel")}
                      </div>
                      <h3>{safe(hotel.name, "Hotel")}</h3>
                      <p className="hotel-location">
                        📍 {safe(hotel.location, "Location on request")}
                      </p>
                      <p className="hotel-price">
                        {safe(
                          formatHotelNightlyPrice(hotel.pricePerNight),
                          "Price on request",
                        )}
                      </p>
                      <p className="hotel-amenities">
                        {safe(hotel.amenities, "")}
                      </p>
                      <a
                        href={hotel.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="book-btn"
                      >
                        Book Now →
                      </a>
                    </motion.div>
                  ))}
                </div>

                {!recommendedHotels.length && (
                  <div className="no-hotels">
                    <p>
                      🏨 No specific hotel recommendations in this itinerary.
                    </p>
                    <p>
                      Use the booking links above to find the perfect
                      accommodation for your trip!
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "restaurants" && (
              <motion.div
                className="tab-content"
                key="restaurants"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="restaurants-header">
                  <h2>🍽️ Recommended Restaurants & Cafes</h2>
                  <p className="section-subtitle">
                    Must-try dining experiences at {itinerary.destination}
                  </p>
                </div>

                {mustTryFoods.length > 0 && (
                  <div className="must-try">
                    <h3>🔥 Must Try Foods</h3>
                    <div className="must-try-list">
                      {mustTryFoods.map((food, idx) => (
                        <span key={`${food}-${idx}`} className="must-try-pill">
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="restaurants-grid">
                  {displayedRestaurants.map((restaurant, idx) => (
                    <motion.div
                      key={idx}
                      className="restaurant-card"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="restaurant-header">
                        <h3>{safe(restaurant.name, "Restaurant")}</h3>
                        <div className="restaurant-rating">
                          {"⭐".repeat(Math.floor(restaurant.rating || 4))}{" "}
                          {safe(restaurant.rating, "")}
                        </div>
                      </div>

                      <div className="restaurant-details">
                        <p className="restaurant-cuisine">
                          🍴 {safe(restaurant.cuisine, "")}
                        </p>
                        <p className="restaurant-location">
                          📍 {safe(restaurant.location, "Location on request")}
                        </p>
                        {restaurant.bestFor && (
                          <p className="restaurant-bestfor">
                            ✨ Best for: {restaurant.bestFor}
                          </p>
                        )}
                        {restaurant.speciality && (
                          <p className="restaurant-speciality">
                            <strong>⭐ SPECIALITY:</strong>{" "}
                            {restaurant.speciality}
                          </p>
                        )}
                        {restaurant.tipForVisit && (
                          <p className="restaurant-tip">
                            <strong>💡 Tip:</strong> {restaurant.tipForVisit}
                          </p>
                        )}
                      </div>

                      <div className="restaurant-actions">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            (restaurant.name || "") +
                              " " +
                              (restaurant.location || ""),
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="restaurant-link"
                        >
                          🗺️ View on Maps
                        </a>
                        <a
                          href={`https://www.zomato.com/search?q=${encodeURIComponent(restaurant.name || "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="restaurant-link"
                        >
                          🍽️ Zomato
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {!displayedRestaurants.length && (
                  <div className="no-restaurants">
                    <p>
                      🍽️ No specific restaurant recommendations in this
                      itinerary.
                    </p>
                    <p>Explore local dining options when you arrive!</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "map" && (
              <motion.div
                className="tab-content"
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="map-section">
                  <h2>🗺️ Destination Map</h2>
                  <div className="map-container">
                    <iframe
                      width="100%"
                      height="500"
                      style={{ border: 0, borderRadius: "12px" }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(itinerary.destination)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {feedbackStatus.type === "success" && (
            <p className="feedback-toast">
              Thanks! Your feedback has been submitted.
            </p>
          )}
        </motion.div>

        <AnimatePresence>
          {isFeedbackModalOpen && (
            <motion.div
              className="feedback-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeFeedbackModal}
            >
              <motion.div
                className="feedback-modal"
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="feedback-modal-header">
                  <h3>Send Feedback</h3>
                  <button
                    type="button"
                    className="feedback-close-btn"
                    onClick={closeFeedbackModal}
                  >
                    ✕
                  </button>
                </div>

                <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                  <label className="feedback-label">Rating</label>
                  <div
                    className="feedback-stars"
                    role="radiogroup"
                    aria-label="Rating"
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`feedback-star ${value <= feedbackRating ? "active" : ""}`}
                        onClick={() => setFeedbackRating(value)}
                        disabled={submittingFeedback}
                        aria-label={`${value} star${value > 1 ? "s" : ""}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <label className="feedback-label" htmlFor="feedback-hometown">
                    Home Town
                  </label>
                  <input
                    id="feedback-hometown"
                    className="feedback-input"
                    value={feedbackHometown}
                    onChange={(event) =>
                      setFeedbackHometown(event.target.value)
                    }
                    placeholder="e.g. Pune"
                    disabled={submittingFeedback}
                    required
                  />

                  <label className="feedback-label" htmlFor="feedback-message">
                    Feedback
                  </label>
                  <textarea
                    id="feedback-message"
                    className="feedback-input feedback-textarea"
                    value={feedbackText}
                    onChange={(event) => setFeedbackText(event.target.value)}
                    placeholder="What did you like, and what can we improve?"
                    rows={4}
                    disabled={submittingFeedback}
                    required
                  />

                  {feedbackStatus.message &&
                    feedbackStatus.type === "error" && (
                      <p className="feedback-status feedback-status-error">
                        {feedbackStatus.message}
                      </p>
                    )}

                  <button
                    type="submit"
                    className="feedback-submit"
                    disabled={submittingFeedback}
                  >
                    {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default ItineraryView;
