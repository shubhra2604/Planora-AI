import { useEffect, useRef } from "react";
import Galaxy from "./Galaxy";
import "./GalaxyBackground.css";

export default function GalaxyBackground() {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Galaxy.jsx attaches mousemove/mouseleave listeners to its own
    // container (.galaxy-container).  Because the wrapper sits at
    // z-index: -1, normal pointer events never reach it.  We solve
    // this by forwarding window-level mouse events directly to the
    // Galaxy container — dispatchEvent bypasses CSS hit-testing.

    const galaxyContainer = wrapper.querySelector(".galaxy-container");
    if (!galaxyContainer) return;

    function forwardMouseMove(e) {
      galaxyContainer.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: false, // don't re-trigger the window listener
        }),
      );
    }

    function forwardMouseLeave() {
      galaxyContainer.dispatchEvent(
        new MouseEvent("mouseleave", { bubbles: false }),
      );
    }

    window.addEventListener("mousemove", forwardMouseMove);
    document.addEventListener("mouseleave", forwardMouseLeave);

    return () => {
      window.removeEventListener("mousemove", forwardMouseMove);
      document.removeEventListener("mouseleave", forwardMouseLeave);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="galaxy-bg-wrapper">
      <Galaxy
        mouseRepulsion
        mouseInteraction
        density={1}
        glowIntensity={0.3}
        saturation={0}
        hueShift={140}
        twinkleIntensity={0.3}
        rotationSpeed={0.1}
        repulsionStrength={2}
        autoCenterRepulsion={0}
        starSpeed={0.5}
        speed={1}
      />
    </div>
  );
}
