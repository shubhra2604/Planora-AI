import React, { useState, useRef, useEffect } from "react";
import "./navbar.css";
import tripLogo from "../assets/trip.png";
import Toast, { useToast } from "./Toast";
import {
  signOut,
  signInWithEmail,
  createUserWithEmail,
  auth,
} from "../firebase";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "firebase/auth";

export default function Navbar({
  showSignup: showSignupProp,
  onSignupChange,
  showLogin: showLoginProp,
  onLoginChange,
}) {
  const { user, authLoading, syncAuthUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toasts, showToast, closeToast } = useToast();
  const [showLogin, setShowLogin] = useState(showLoginProp || false);
  const [showSignup, setShowSignup] = useState(showSignupProp || false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const dropdownRef = useRef(null);
  const emailInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setShowLogin(false);
    setShowSignup(false);
    setLoginError("");
    setSignupError("");
  }, [user]);

  useEffect(() => {
    if (showSignupProp) {
      setLoginError("");
      setShowSignup(true);
    }
  }, [showSignupProp]);

  useEffect(() => {
    if (showLoginProp) {
      setSignupError("");
      setShowLogin(true);
    }
  }, [showLoginProp]);

  useEffect(() => {
    async function fetchItineraries() {
      setLoading(true);
      setError("");
      try {
        const tripsRef = collection(db, "users", user.uid, "trips");
        const q = query(tripsRef, orderBy("daysCount", "desc"), limit(5));
        const snapshot = await getDocs(q);
        const trips = snapshot.docs.map((tripDoc) => ({
          id: tripDoc.id,
          ...tripDoc.data(),
        }));
        setItineraries(trips);
      } catch {
        setError("Unable to fetch your itineraries. Try again.");
        setItineraries([]);
      } finally {
        setLoading(false);
      }
    }
    if (dropdownOpen && user) {
      fetchItineraries();
    }
  }, [dropdownOpen, user]);

  const handleDropdownToggle = () => {
    setDropdownOpen((open) => !open);
  };

  const handleDropdownBlur = (event) => {
    if (!dropdownRef.current.contains(event.relatedTarget)) {
      setDropdownOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch {
      showToast({
        type: "error",
        message: "Sign-out failed. No worries—please try again.",
      });
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");
    try {
      await signInWithEmail(authEmail, authPassword);
      setShowLogin(false);
      onLoginChange?.(false);
      setAuthEmail("");
      setAuthPassword("");
    } catch {
      setAuthEmail("");
      setAuthPassword("");
      setLoginError(
        "Couldn't sign you in. Check your email and password, then try again.",
      );
      emailInputRef.current?.focus();
    }
  };

  const handleSignupFinal = async (event) => {
    event.preventDefault();
    setSignupError("");
    try {
      await createUserWithEmail(authEmail, authPassword, authName);

      if (auth.currentUser && authName?.trim()) {
        await updateProfile(auth.currentUser, {
          displayName: authName.trim(),
        });
      }
      if (auth.currentUser) {
        await auth.currentUser.reload();
      }
      syncAuthUser();

      setShowSignup(false);
      onSignupChange?.(false);
      setSignupError("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
    } catch (err) {
      const message = (err?.message || "").toLowerCase();
      if (message.includes("email") && message.includes("use")) {
        setSignupError(
          "This email is already registered. Try signing in instead.",
        );
      } else if (message.includes("password")) {
        setSignupError("Password is too short. Use at least 6 characters.");
      } else {
        setSignupError("Account creation failed. Please try again.");
      }
    }
  };

  const handleDeleteItinerary = async (tripId) => {
    if (!user || !tripId) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "trips", tripId));
      setItineraries((prev) => prev.filter((trip) => trip.id !== tripId));
    } catch {
      showToast({
        type: "error",
        message: "Couldn’t delete that itinerary. Please try again.",
      });
    }
  };

  const handleOpenItinerary = (trip) => {
    if (!trip?.id) return;
    const itineraryData = trip.itinerary || trip;
    navigate(`/itinerary/${trip.id}`, {
      state: { itinerary: itineraryData },
    });
  };

  const profileLabel = user?.displayName || "Traveler";

  return (
    <>
      <Toast toasts={toasts} onClose={closeToast} />
      <nav className="navbar">
        <div className="nav-left">
          <img
            src={tripLogo}
            alt="Planora AI Logo"
            className="logo logo-image-large"
            style={{ cursor: "pointer" }}
            onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
          <span className="logo-text">
            Planora <span className="logo-ai">AI</span>
          </span>
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <span className="profile-name">{profileLabel}</span>
              <div
                className="dropdown"
                tabIndex={0}
                ref={dropdownRef}
                onBlur={handleDropdownBlur}
              >
                <button
                  className="nav-button itineraries-btn"
                  onClick={handleDropdownToggle}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <span className="nav-button-label">My Itineraries</span>
                  <span
                    className={`nav-button-arrow${dropdownOpen ? " dropdown-arrow-open" : ""}`}
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu wide-dropdown">
                    {loading ? (
                      <div
                        className="dropdown-item"
                        style={{ color: "#b7c9e7" }}
                      >
                        Loading...
                      </div>
                    ) : error ? (
                      <div
                        className="dropdown-item"
                        style={{ color: "#ffb4b4" }}
                      >
                        {error}
                      </div>
                    ) : itineraries.length === 0 ? (
                      <div
                        className="dropdown-item"
                        style={{ color: "#b7c9e7" }}
                      >
                        No itineraries found
                      </div>
                    ) : (
                      itineraries.map((trip) => (
                        <div
                          className="dropdown-item itinerary-item"
                          key={trip.id}
                          tabIndex={-1}
                        >
                          <span
                            className="itinerary-title"
                            onClick={() => handleOpenItinerary(trip)}
                            style={{
                              cursor: "pointer",
                              color: "#fff",
                              fontWeight: 500,
                            }}
                          >
                            {trip.title || "Untitled Trip"}
                          </span>
                          <button
                            className="delete-itinerary-btn"
                            title="Delete itinerary"
                            onClick={() => handleDeleteItinerary(trip.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button className="nav-button signout" onClick={handleSignOut}>
                Sign Out
              </button>
            </>
          ) : authLoading ? (
            <span className="profile-name">Loading...</span>
          ) : (
            <>
              <button
                className="nav-button"
                onClick={() => {
                  setSignupError("");
                  setShowLogin(true);
                }}
              >
                Login
              </button>
              <button
                className="nav-button"
                onClick={() => {
                  setLoginError("");
                  setShowSignup(true);
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {showLogin && (
        <div className="auth-modal-overlay">
          <form className="auth-form" onSubmit={handleLogin}>
            <h3>Login</h3>
            <input
              ref={emailInputRef}
              className={loginError ? "auth-input-error" : ""}
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              required
            />
            <input
              className={loginError ? "auth-input-error" : ""}
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              required
            />
            {loginError && <div className="auth-error">{loginError}</div>}
            <button className="nav-button" type="submit">
              Login
            </button>
            <button
              className="nav-button"
              type="button"
              onClick={() => {
                setShowLogin(false);
                setLoginError("");
                onLoginChange?.(false);
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {showSignup && (
        <div className="auth-modal-overlay">
          <form className="auth-form" onSubmit={handleSignupFinal}>
            <h3>Sign Up</h3>
            <input
              className={signupError ? "auth-input-error" : ""}
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              required
            />
            <input
              className={signupError ? "auth-input-error" : ""}
              type="text"
              placeholder="Name"
              value={authName}
              onChange={(event) => setAuthName(event.target.value)}
              required
            />
            <input
              className={signupError ? "auth-input-error" : ""}
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              required
            />
            {signupError && <div className="auth-error">{signupError}</div>}
            <button className="nav-button" type="submit">
              Create Account
            </button>
            <button
              className="nav-button"
              type="button"
              onClick={() => {
                setShowSignup(false);
                setSignupError("");
                onSignupChange?.(false);
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </>
  );
}
