import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { SPRING_CONFIG } from "../constants/animation";
import { PLANNER_CONFIG, PLANNER_LOADING_MESSAGES } from "../constants/planner";
import "./planner.css";
import Toast, { useToast } from "./Toast";
import { generateItinerary } from "../firebase";
import { buildItineraryPathById } from "../utils/itineraryRoute";
import { saveRecentItinerary, createTripId } from "../utils/recentTrips";

function Planner({ user, prefill = {}, onSignup }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    startDate: "",
    endDate: "",
    style: "Relaxed",
    travelers: 1,
    budget: "",
    aiMessage: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [cancelNotice, setCancelNotice] = useState("");
  const activeRequestIdRef = useRef(0);
  const cancelledRequestIdRef = useRef(null);
  const { toasts, showToast, closeToast } = useToast();

  const magneticX = useMotionValue(0);
  const magneticY = useMotionValue(0);
  const smoothMagneticX = useSpring(magneticX, SPRING_CONFIG);
  const smoothMagneticY = useSpring(magneticY, SPRING_CONFIG);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const isNetworkError = (err) => {
    const msg = (err?.message || "").toLowerCase();
    return (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("failed to fetch") ||
      msg.includes("timeout") ||
      msg.includes("econnrefused") ||
      !navigator.onLine
    );
  };

  const validateForm = () => {
    const errs = {};
    if (!form.destination.trim()) {
      errs.destination = true;
      showToast({
        message: "Please enter a destination to continue.",
        type: "error",
      });
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.startDate = true;
      errs.endDate = true;
      showToast({
        message: "Your travel dates don’t look right — please check them.",
        type: "error",
      });
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!user) {
      onSignup?.();
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);
    setCancelNotice("");

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    cancelledRequestIdRef.current = null;

    try {
      const result = await generateItinerary({
        origin: form.origin || undefined,
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        travelers: parseInt(form.travelers) || 1,
        budget: form.budget ? parseInt(form.budget) * 1000 : undefined,
        style: form.style,
        aiMessage: form.aiMessage?.trim() || undefined,
      });

      if (
        cancelledRequestIdRef.current === requestId ||
        activeRequestIdRef.current !== requestId
      ) {
        return;
      }

      if (result.data?.itinerary) {
        const requestedBudget = form.budget
          ? parseInt(form.budget) * 1000
          : null;
        const itineraryWithMeta = {
          ...result.data.itinerary,
          requestedBudget,
          travelers: parseInt(form.travelers) || 1,
          aiMessage: form.aiMessage?.trim() || "",
        };
        // Compute a stable trip ID and save to Firestore
        const tripId = createTripId(itineraryWithMeta);
        if (user) {
          saveRecentItinerary(user, itineraryWithMeta).catch((e) =>
            console.error("Failed to save itinerary:", e),
          );
        }
        navigate(buildItineraryPathById(tripId), {
          state: { itinerary: itineraryWithMeta },
        });
      }
    } catch (err) {
      if (
        cancelledRequestIdRef.current !== requestId &&
        activeRequestIdRef.current === requestId
      ) {
        console.error("Itinerary generation error:", err);
        if (isNetworkError(err)) {
          showToast({
            type: "error",
            message:
              "Looks like the internet connection dropped or our servers are busy.",
            detail: "Please check your connection and retry.",
            onRetry: () => handleSubmit({ preventDefault: () => {} }),
          });
        } else {
          showToast({
            type: "error",
            message:
              "Sorry, I couldn\u2019t generate your itinerary right now. Please try again in a moment!",
            detail: "Tip: Check your inputs or try a different destination.",
          });
        }
      }
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    if (!submitting) return;
    cancelledRequestIdRef.current = activeRequestIdRef.current;
    setSubmitting(false);
    setCancelNotice("Generation stopped. Update details and try again.");
  };

  const handleMagneticMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    magneticX.set(x * 10);
    magneticY.set(y * 8);
  };

  const resetMagneticMove = () => {
    magneticX.set(0);
    magneticY.set(0);
  };

  useEffect(() => {
    if (!submitting) {
      setLoadingMessageIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setLoadingMessageIndex(
        (prev) => (prev + 1) % PLANNER_LOADING_MESSAGES.length,
      );
    }, PLANNER_CONFIG.LOADING_MESSAGE_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [submitting]);

  useEffect(() => {
    if (!prefill || Object.keys(prefill).length === 0) return;
    setForm((s) => ({
      ...s,
      ...(prefill.origin ? { origin: prefill.origin } : {}),
      ...(prefill.destination ? { destination: prefill.destination } : {}),
      ...(prefill.startDate ? { startDate: prefill.startDate } : {}),
      ...(prefill.endDate ? { endDate: prefill.endDate } : {}),
      ...(prefill.style ? { style: prefill.style } : {}),
      ...(prefill.travelers ? { travelers: prefill.travelers } : {}),
      ...(prefill.budget ? { budget: prefill.budget } : {}),
    }));
  }, [prefill]);

  return (
    <>
      <Toast toasts={toasts} onClose={closeToast} />
      {user && (
        <motion.form
          className="planner"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="planner-body">
            <div className="form-section">
              <div className="form-group">
                <label>Where are you traveling from?</label>
                <input
                  name="origin"
                  value={form.origin}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                  className="planner-input"
                />
              </div>

              <div className="form-group">
                <label>Destination</label>
                <input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  placeholder="e.g. Paris"
                  required
                  className={`planner-input${fieldErrors.destination ? " input-error input-shake" : ""}`}
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Departure Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  className={`planner-input${fieldErrors.startDate ? " input-error input-shake" : ""}`}
                />
              </div>

              <div className="form-group">
                <label>Return Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                  className={`planner-input${fieldErrors.endDate ? " input-error input-shake" : ""}`}
                />
              </div>

              <div className="form-group">
                <label>Travel Style</label>
                <select
                  name="style"
                  value={form.style}
                  onChange={handleChange}
                  className="planner-input"
                >
                  <option>Relaxed</option>
                  <option>Adventure</option>
                  <option>Family</option>
                  <option>Couple</option>
                  <option>Budget</option>
                  <option>Luxury</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Number of Travelers</label>
                <input
                  name="travelers"
                  type="number"
                  min={PLANNER_CONFIG.MIN_TRAVELERS}
                  max={PLANNER_CONFIG.MAX_TRAVELERS}
                  value={form.travelers}
                  onChange={handleChange}
                  className="planner-input"
                />
              </div>

              <div className="form-group">
                <label>Budget (INR, in K)</label>
                <input
                  name="budget"
                  type="number"
                  placeholder="e.g. 50"
                  value={form.budget}
                  onChange={handleChange}
                  className="planner-input"
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Whisper something to Planora</label>
                <textarea
                  name="aiMessage"
                  value={form.aiMessage}
                  onChange={handleChange}
                  placeholder="e.g. surprise me with hidden gems, skip touristy traps, keep it vegetarian & romantic."
                  className="planner-input planner-textarea"
                  rows={3}
                  maxLength={PLANNER_CONFIG.AI_MESSAGE_LIMIT}
                />
              </div>
            </div>

            <motion.button
              className="planner-submit"
              type="submit"
              disabled={submitting}
              style={{ x: smoothMagneticX, y: smoothMagneticY }}
              onMouseMove={handleMagneticMove}
              onMouseLeave={resetMagneticMove}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING_CONFIG}
            >
              {submitting ? (
                <>
                  <span className="spinner" />
                  Planning...
                </>
              ) : (
                "Plan Trip"
              )}
            </motion.button>

            {cancelNotice && (
              <div className="planner-cancel-notice">{cancelNotice}</div>
            )}
          </div>

          {submitting && (
            <div
              className="planner-loading-overlay"
              role="status"
              aria-live="polite"
            >
              <div className="planner-loading-card">
                <div className="loading-label">Building your itinerary</div>
                <div className="loading-message">
                  {PLANNER_LOADING_MESSAGES[loadingMessageIndex]}
                </div>
                <div className="route-teaser" aria-hidden="true">
                  <svg viewBox="0 0 220 46" className="route-svg">
                    <path
                      d="M6 36 C36 6, 70 6, 100 26 S170 46, 214 16"
                      className="route-path"
                    />
                    <circle r="4" className="route-dot">
                      <animateMotion
                        dur="2.6s"
                        repeatCount="indefinite"
                        path="M6 36 C36 6, 70 6, 100 26 S170 46, 214 16"
                      />
                    </circle>
                  </svg>
                </div>
                <div className="loading-dots" aria-hidden="true">
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                </div>
                <button
                  type="button"
                  className="planner-cancel"
                  onClick={handleCancel}
                >
                  Stop generating
                </button>
              </div>
            </div>
          )}
        </motion.form>
      )}

      {!user && (
        <motion.div
          className="planner planner-guest"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="planner-body guest-body">
            <button
              type="button"
              className="planner-submit guest-plan-button"
              onClick={() => onSignup?.()}
            >
              Open Planner
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}

Planner.displayName = "Planner";

export default Planner;

/* Re-export the hook so parent pages can also call showToast if needed */
export { useToast };
