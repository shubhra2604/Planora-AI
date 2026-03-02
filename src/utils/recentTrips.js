import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const RECENT_TRIPS_LIMIT = 5;

function getUserId(user) {
  return user?.uid || null;
}

function createTripFingerprint(itinerary) {
  return JSON.stringify([
    itinerary?.title || "",
    itinerary?.destination || "",
    itinerary?.days?.length || 0,
    itinerary?.days?.[0]?.date || "",
    itinerary?.estimatedTotalCost || "",
  ]);
}

function createTripId(itinerary) {
  const fingerprint = createTripFingerprint(itinerary);
  let hash = 2166136261;
  for (let i = 0; i < fingerprint.length; i++) {
    hash ^= fingerprint.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `trip_${(hash >>> 0).toString(16)}`;
}
export { createTripId };

function getTripsCollection(userId) {
  return collection(db, "users", userId, "trips");
}

async function pruneTripsForUser(userId) {
  const allTripsQuery = query(
    getTripsCollection(userId),
    orderBy("savedAt", "desc"),
  );
  const snapshot = await getDocs(allTripsQuery);
  if (snapshot.docs.length <= RECENT_TRIPS_LIMIT) return;

  const staleDocs = snapshot.docs.slice(RECENT_TRIPS_LIMIT);
  await Promise.all(staleDocs.map((tripDoc) => deleteDoc(tripDoc.ref)));
}

function createTripRecord(itinerary) {
  const savedAt = Date.now();
  return {
    id: createTripId(itinerary),
    fingerprint: createTripFingerprint(itinerary),
    savedAt,
    title: itinerary?.title || "Untitled Trip",
    destination: itinerary?.destination || "Unknown destination",
    daysCount: itinerary?.days?.length || 0,
    itinerary,
  };
}

export async function getRecentItineraries(user) {
  const userId = getUserId(user);
  if (!userId) return [];

  try {
    const recentTripsQuery = query(
      getTripsCollection(userId),
      orderBy("savedAt", "desc"),
      limit(RECENT_TRIPS_LIMIT),
    );
    const snapshot = await getDocs(recentTripsQuery);
    return snapshot.docs.map((tripDoc) => {
      const data = tripDoc.data() || {};
      return {
        id: tripDoc.id,
        title: data.title || "Untitled Trip",
        destination: data.destination || "Unknown destination",
        daysCount: data.daysCount || 0,
        savedAt: data.savedAt || Date.now(),
        itinerary: data.itinerary || null,
      };
    });
  } catch (error) {
    console.error("Failed to fetch recent itineraries", error);
    return [];
  }
}

export async function saveRecentItinerary(user, itinerary) {
  const userId = getUserId(user);
  if (!itinerary || !userId) return;

  try {
    const nextTrip = createTripRecord(itinerary);
    const tripRef = doc(getTripsCollection(userId), nextTrip.id);
    await setDoc(
      tripRef,
      {
        title: nextTrip.title,
        destination: nextTrip.destination,
        daysCount: nextTrip.daysCount,
        fingerprint: nextTrip.fingerprint,
        savedAt: nextTrip.savedAt,
        itinerary: nextTrip.itinerary,
      },
      { merge: true },
    );
    await pruneTripsForUser(userId);
  } catch (error) {
    console.error("Failed to save recent itinerary", error);
  }

  return getRecentItineraries(user);
}

export async function removeRecentItinerary(user, tripId) {
  const userId = getUserId(user);
  if (!tripId || !userId) return [];

  try {
    await deleteDoc(doc(getTripsCollection(userId), tripId));
  } catch (error) {
    console.error("Failed to remove recent itinerary", error);
  }

  return getRecentItineraries(user);
}
