import { initializeApp } from "firebase/app";
import {
  getAuth,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const REQUIRED_FIREBASE_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingFirebaseEnvKeys = REQUIRED_FIREBASE_ENV_KEYS.filter(
  (key) => !import.meta.env[key],
);

if (missingFirebaseEnvKeys.length > 0) {
  console.warn(
    `Missing Firebase env vars: ${missingFirebaseEnvKeys.join(", ")}. App initialization may fail until these are set.`,
  );
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const functionsRegion =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1";
const useFirebaseEmulators =
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, functionsRegion);
const db = getFirestore(app);

if (useFirebaseEmulators) {
  try {
    connectFunctionsEmulator(functions, "localhost", 5001);
  } catch {}
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch {}
}

async function upsertUserProfile(user, { isNew = false, displayName } = {}) {
  if (!user?.uid) return;
  const profileData = {
    displayName: displayName ?? user.displayName ?? "",
    email: user.email || "",
    updatedAt: serverTimestamp(),
  };
  if (isNew) {
    profileData.createdAt = serverTimestamp();
  }
  await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
}

async function signInWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  upsertUserProfile(credential.user, {}).catch(() => {});
  return credential;
}

async function createUserWithEmail(email, password, firstName) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  if (firstName) {
    await updateProfile(userCredential.user, {
      displayName: firstName,
    });
    try {
      await userCredential.user.reload();
    } catch {
      void 0;
    }
  }
  upsertUserProfile(userCredential.user, {
    isNew: true,
    displayName: firstName || undefined,
  }).catch(() => {});
  return userCredential;
}

function sendOtpEmail(email) {
  const requestOtp = httpsCallable(functions, "requestOtp");
  return requestOtp({ email });
}

function verifyOtpCode(email, otp) {
  const verifyOtp = httpsCallable(functions, "verifyOtp");
  return verifyOtp({ email, otp });
}

function generateItinerary(tripData) {
  const generateItinerary = httpsCallable(functions, "generateItinerary");
  return generateItinerary(tripData);
}

function generatePDF(itineraryData) {
  const generatePDF = httpsCallable(functions, "generatePDF");
  return generatePDF(itineraryData);
}

function signOut() {
  return firebaseSignOut(auth);
}

export {
  auth,
  db,
  signOut,
  signInWithEmail,
  createUserWithEmail,
  sendOtpEmail,
  verifyOtpCode,
  generateItinerary,
  generatePDF,
};
