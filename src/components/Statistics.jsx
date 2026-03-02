import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRecentPublicFeedback } from "../utils/feedback";
import "./statistics.css";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "Mumbai, India",
    rating: 5,
    review:
      "Planora AI saved me 15 hours of planning! The AI-generated itinerary perfectly matched my travel style and budget.",
    avatar: "👩‍💼",
    destination: "Bali, Indonesia",
  },
  {
    id: 2,
    name: "Rohan Patel",
    location: "Bangalore, India",
    rating: 5,
    review:
      "Best travel planning tool I've used. The AI suggestions were surprisingly accurate and personalized.",
    avatar: "👨‍💻",
    destination: "Thailand",
  },
  {
    id: 3,
    name: "Sarah Anderson",
    location: "USA",
    rating: 5,
    review:
      "Finally a planner that understands my budget constraints without compromising on experience. Highly recommend!",
    avatar: "👩‍🔬",
    destination: "Goa",
  },
  {
    id: 4,
    name: "Arjun Verma",
    location: "Delhi, India",
    rating: 5,
    review:
      "The detailed day-by-day breakdown and activity suggestions saved my family trip. Perfect integration!",
    avatar: "👨‍🎓",
    destination: "Kerala",
  },
  {
    id: 5,
    name: "Emma Wilson",
    location: "London, UK",
    rating: 5,
    review:
      "I planned 3 trips already. The cost breakdown is incredibly accurate and helps with budgeting.",
    avatar: "👩‍🎨",
    destination: "Dubai",
  },
];

function StarRating({ rating }) {
  return (
    <div className="stars">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < rating ? "star filled" : "star"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function Statistics() {
  const [testimonials, setTestimonials] = useState(TESTIMONIALS);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const autoScroll = useRef(null);

  const next = () => {
    if (!testimonials.length) return;
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    if (!testimonials.length) return;
    setDirection(-1);
    setCurrent(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  const onDragEnd = (_, info) => {
    if (info.offset.x > 70) {
      prev();
      return;
    }
    if (info.offset.x < -70) {
      next();
    }
  };

  const cardVariants = {
    enter: (value) => ({ x: value > 0 ? 110 : -110, opacity: 0, scale: 0.96 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (value) => ({ x: value > 0 ? -110 : 110, opacity: 0, scale: 0.96 }),
  };
  const activeTestimonial = testimonials[current] || TESTIMONIALS[0];

  useEffect(() => {
    let isMounted = true;

    const loadFeedback = async () => {
      try {
        const recentFeedback = await getRecentPublicFeedback(5);
        if (!isMounted || !recentFeedback.length) return;

        const mapped = recentFeedback.map((item, index) => ({
          id: item.id || `fb-${index}`,
          name: item.name,
          location: item.location,
          rating: item.rating,
          review: item.review,
          avatar: "👤",
          destination: item.destination,
        }));

        setTestimonials(mapped);
        setCurrent(0);
      } catch {}
    };

    void loadFeedback();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!testimonials.length) return undefined;

    autoScroll.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(autoScroll.current);
  }, [testimonials]);

  return (
    <motion.section
      className="statistics ag-reveal"
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.58 }}
    >
      <div className="stats-container">
        <motion.div
          className="stats-header"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.52 }}
        >
          <h2>Loved by Travelers Everywhere</h2>
          <p>See what real users are saying about Planora AI</p>
        </motion.div>

        <div className="testimonials-carousel">
          <motion.button
            className="carousel-btn prev magnetic"
            onClick={prev}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            ‹
          </motion.button>

          <div className="testimonials-track">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={activeTestimonial.id}
                className="testimonials-wrapper"
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 18,
                  duration: 0.55,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={onDragEnd}
              >
                <motion.div
                  className="testimonial-card ag-float"
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="testimonial-top">
                    <div className="testimonial-header">
                      <div className="avatar">{activeTestimonial.avatar}</div>
                      <div className="testimonial-user">
                        <div className="user-name">
                          {activeTestimonial.name}
                        </div>
                        <div className="user-location">
                          {activeTestimonial.location}
                        </div>
                      </div>
                    </div>
                    <StarRating rating={activeTestimonial.rating} />
                  </div>

                  <p className="testimonial-text">
                    "{activeTestimonial.review}"
                  </p>

                  <div className="testimonial-footer">
                    <span className="destination-tag">
                      ✈️ {activeTestimonial.destination}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.button
            className="carousel-btn next magnetic"
            onClick={next}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            ›
          </motion.button>
        </div>

        <div className="carousel-indicators">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              className={`indicator ${idx === current ? "active" : ""}`}
              onClick={() => {
                setDirection(idx > current ? 1 : -1);
                setCurrent(idx);
              }}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
