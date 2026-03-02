import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import ItineraryPage from "./pages/ItineraryPage";

function MotionObserver() {
  const location = useLocation();

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll(".ag-reveal"));
    if (!nodes.length) return;

    nodes.forEach((node, index) => {
      const delayMs = Math.min(index * 70, 420);
      node.style.setProperty("--ag-delay", `${delayMs}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("ag-inview");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <MotionObserver />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/itinerary/shared/:id" element={<ItineraryPage />} />
        <Route path="/itinerary" element={<ItineraryPage />} />
        <Route path="/itinerary/:tripId" element={<ItineraryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
