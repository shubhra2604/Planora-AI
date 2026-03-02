import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

function getDestinationTitle(itinerary) {
  return itinerary?.destination || itinerary?.title || "Unknown destination";
}

function normalizeFeedbackName(user) {
  const name = user?.displayName || user?.email?.split("@")[0] || "Traveler";
  return String(name).trim() || "Traveler";
}

export async function submitItineraryFeedback({
  hometown,
  user,
  itinerary,
  rating,
  feedback,
}) {
  const userId = user?.uid || "anonymous";
  const feedbackCollection = collection(db, "users", userId, "feedback");
  const publicFeedbackCollection = collection(db, "publicFeedback");

  const payload = {
    rating: Math.max(1, Math.min(5, Number(rating) || 5)),
    feedback: String(feedback || "").trim(),
    hometown: String(hometown || "").trim(),
    itineraryTitle: itinerary?.title || "",
    itineraryDestination: getDestinationTitle(itinerary),
    itineraryDays: itinerary?.days?.length || 0,
    createdAt: serverTimestamp(),
  };

  if (user?.uid) {
    await addDoc(feedbackCollection, payload);
  }

  await addDoc(publicFeedbackCollection, {
    ...payload,
    userName: normalizeFeedbackName(user),
  });
}

export async function getRecentPublicFeedback(maxItems = 8) {
  const feedbackQuery = query(
    collection(db, "publicFeedback"),
    orderBy("createdAt", "desc"),
    limit(maxItems),
  );

  const snapshot = await getDocs(feedbackQuery);
  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() || {};
    return {
      id: docSnapshot.id,
      name: data.userName || "Traveler",
      location: data.hometown || "Unknown hometown",
      rating: Number(data.rating) || 5,
      review: data.feedback || "Great itinerary planning experience.",
      destination: data.itineraryDestination || "Unknown destination",
    };
  });
}
