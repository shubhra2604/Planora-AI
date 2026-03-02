import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./itineraryPage.css";
import Navbar from "../components/Navbar";
import GalaxyBackground from "../components/GalaxyBackground";
import ItineraryView from "../components/ItineraryView";
import Toast, { useToast } from "../components/Toast";
import {
  saveRecentItinerary,
  getRecentItineraries,
} from "../utils/recentTrips";
import { useAuth } from "../context/AuthContext";

function ItineraryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tripId } = useParams();
  const { user, authLoading, authUiReady } = useAuth();
  const [itinerary, setItinerary] = useState(location.state?.itinerary || null);
  const [loading, setLoading] = useState(!location.state?.itinerary);
  const { toasts, showToast, closeToast } = useToast();

  // Listen for trip deletion in real time and redirect if deleted
  useEffect(() => {
    if (!user || !tripId) return;
    let unsub = null;
    (async () => {
      const { doc, onSnapshot, getFirestore } =
        await import("firebase/firestore");
      const db = getFirestore();
      const tripRef = doc(db, "users", user.uid, "trips", tripId);
      unsub = onSnapshot(tripRef, (docSnap) => {
        if (!docSnap.exists()) {
          setItinerary(null); // triggers redirect below
        }
      });
    })();
    return () => {
      if (unsub) unsub();
    };
  }, [user, tripId]);

  // Update itinerary when route changes (support navigation with location.state)
  useEffect(() => {
    if (location.state?.itinerary) {
      setItinerary(location.state.itinerary);
    } else {
      // clear so the fetch effect can run
      setItinerary(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  useEffect(() => {
    // If no itinerary data, try to fetch from Firestore using tripId
    if (!itinerary && user && tripId) {
      setLoading(true);
      getRecentItineraries(user).then((trips) => {
        const found = trips.find((trip) => trip.id === tripId);
        if (found && found.itinerary) {
          setItinerary(found.itinerary);
        } else {
          setItinerary(null);
        }
        setLoading(false);
      });
    } else if (!itinerary && !user && !authLoading) {
      // If not logged in, redirect to home
      setLoading(false);
      navigate("/");
    } else if (itinerary) {
      setLoading(false);
    }
  }, [itinerary, user, tripId, navigate, authLoading]);

  // Do not auto-save placeholder/generating itineraries created for immediate navigation
  useEffect(() => {
    if (!user || !itinerary) return;
    if (itinerary.status === "generating") return;
    void saveRecentItinerary(user, itinerary);
  }, [user, itinerary]);

  const handleBack = () => {
    navigate("/");
  };

  // If no itinerary, redirect to home (fixes blank /itinerary page after deletion)
  useEffect(() => {
    if (!itinerary && authUiReady && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [itinerary, authUiReady, authLoading, navigate]);

  if (loading) {
    return (
      <div className="itinerary-spinner-container">
        <div className="itinerary-spinner" />
        <div style={{ marginTop: 16, color: "#a5b4fc", fontWeight: 500 }}>
          Hang tight, loading your itinerary…
        </div>
      </div>
    );
  }
  if (!itinerary) {
    return null;
  }

  // Handler to delete itinerary and redirect
  const handleDeleteItinerary = async () => {
    if (!user || !tripId) return;
    try {
      const { deleteDoc, doc, getFirestore } =
        await import("firebase/firestore");
      const db = getFirestore();
      await deleteDoc(doc(db, "users", user.uid, "trips", tripId));
      navigate("/");
    } catch {
      showToast({
        type: "error",
        message:
          "Oops! We couldn\u2019t remove that itinerary. Please try again.",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55 }}
    >
      <Toast toasts={toasts} onClose={closeToast} />
      <GalaxyBackground />
      <Navbar />
      <ItineraryView
        itinerary={itinerary}
        onBack={handleBack}
        user={user}
        onDelete={handleDeleteItinerary}
      />
    </motion.div>
  );
}

export default ItineraryPage;
