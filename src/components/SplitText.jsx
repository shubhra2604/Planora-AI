import { useEffect, useMemo, useRef, useState } from "react";
import "./SplitText.css";

const EASE_MAP = {
  "power1.out": "cubic-bezier(0.16, 1, 0.3, 1)",
  "power2.out": "cubic-bezier(0.22, 1, 0.36, 1)",
  "power3.out": "cubic-bezier(0.22, 1, 0.36, 1)",
  "power4.out": "cubic-bezier(0.19, 1, 0.22, 1)",
  "expo.out": "cubic-bezier(0.16, 1, 0.3, 1)",
  "sine.out": "cubic-bezier(0.39, 0.575, 0.565, 1)",
};

function toUnit(value) {
  if (value == null) return "0px";
  if (typeof value === "number") return `${value}px`;
  return String(value);
}

function buildTransform(state) {
  const x = toUnit(state?.x ?? 0);
  const y = toUnit(state?.y ?? 0);
  const rotate = state?.rotate ?? 0;
  const scale = state?.scale ?? 1;
  return `translate3d(${x}, ${y}, 0) rotate(${rotate}deg) scale(${scale})`;
}

function splitTextUnits(text, splitType) {
  if (!text) return [];

  if (splitType.includes("lines")) {
    return text.split("\n").map((line, index) => ({
      type: "line",
      value: line,
      key: `line-${index}`,
    }));
  }

  if (splitType.includes("words")) {
    return text.split(/(\s+)/).map((word, index) => ({
      type: /^\s+$/.test(word) ? "space" : "word",
      value: word,
      key: `word-${index}`,
    }));
  }

  return Array.from(text).map((char, index) => ({
    type: char === " " ? "space" : "char",
    value: char,
    key: `char-${index}`,
  }));
}

export default function SplitText({
  text,
  className = "",
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  tag = "p",
  onLetterAnimationComplete,
}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const completedRef = useRef(false);

  const units = useMemo(
    () => splitTextUnits(text, splitType),
    [text, splitType],
  );
  const timingFunction = EASE_MAP[ease] || ease || "ease-out";
  const totalDelayMs = Math.max(0, (units.length - 1) * delay);
  const totalDurationMs = Math.max(0, duration * 1000 + totalDelayMs);

  useEffect(() => {
    completedRef.current = false;
    const timer = window.setTimeout(() => {
      setIsInView(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [text, splitType]);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin, text, splitType]);

  useEffect(() => {
    if (!isInView || completedRef.current) return;

    const timer = window.setTimeout(() => {
      completedRef.current = true;
      onLetterAnimationComplete?.();
    }, totalDurationMs + 20);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isInView, totalDurationMs, onLetterAnimationComplete]);

  const style = {
    textAlign,
    overflow: "hidden",
    display: tag && /^h[1-6]$/.test(tag) ? "block" : "inline-block",
    whiteSpace: splitType.includes("lines") ? "pre-wrap" : "normal",
    wordWrap: "break-word",
    willChange: "transform, opacity",
  };

  const classes = `split-parent ${className}`.trim();
  const Tag = tag;

  if (!text) {
    return (
      <Tag ref={ref} style={style} className={classes}>
        {text}
      </Tag>
    );
  }

  const fromOpacity = from?.opacity ?? 0;
  const toOpacity = to?.opacity ?? 1;

  return (
    <Tag ref={ref} style={style} className={classes} aria-label={text}>
      <span className="split-sr-only">{text}</span>
      <span aria-hidden="true">
        {units.map((unit, index) => {
          if (unit.type === "line") {
            return (
              <span key={unit.key} className="split-line-wrapper">
                {unit.value}
                {index < units.length - 1 ? <br /> : null}
              </span>
            );
          }

          if (unit.type === "space") {
            return (
              <span key={unit.key} className="split-space">
                {unit.value.replace(/ /g, "\u00A0")}
              </span>
            );
          }

          return (
            <span
              key={unit.key}
              className={`split-${unit.type}`}
              style={{
                opacity: isInView ? toOpacity : fromOpacity,
                transform: isInView ? buildTransform(to) : buildTransform(from),
                transitionProperty: "transform, opacity",
                transitionDuration: `${duration}s`,
                transitionTimingFunction: timingFunction,
                transitionDelay: `${(index * delay) / 1000}s`,
              }}
            >
              {unit.value}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
