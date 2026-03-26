require("dotenv").config();

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require("pdfkit");

admin.initializeApp();

const GEMINI_API_KEY_SECRET = defineSecret("GEMINI_API_KEY");

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function getSecretValue(secret, fallbackKey) {
  const secretValue = secret.value();
  if (secretValue) {
    return secretValue;
  }
  return process.env[fallbackKey];
}

function getMailer() {
  const host = getSecretValue(SMTP_HOST_SECRET, "LOCAL_SMTP_HOST");
  const port = Number(
    getSecretValue(SMTP_PORT_SECRET, "LOCAL_SMTP_PORT") || 587,
  );
  const secure =
    getSecretValue(SMTP_SECURE_SECRET, "LOCAL_SMTP_SECURE") === "true";
  const user = getSecretValue(SMTP_USER_SECRET, "LOCAL_SMTP_USER");
  const pass = getSecretValue(SMTP_PASS_SECRET, "LOCAL_SMTP_PASS");

  if (!host || !user || !pass) {
    throw new HttpsError(
      "failed-precondition",
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.",
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDateISO(date) {
  return date.toISOString().slice(0, 10);
}

function buildBudgetAwareFallbackHotels(destination, budget, daysCount) {
  const allHotels = [
    {
      name: "Hotel Aurora",
      type: "Mid-range",
      pricePerNight: 3500,
      location: `${destination} Central`,
      amenities: "WiFi, breakfast, parking",
      bookingUrl: "https://www.booking.com",
    },
    {
      name: "City Comfort Inn",
      type: "Budget",
      pricePerNight: 2200,
      location: `${destination} Market Area`,
      amenities: "WiFi, AC, breakfast",
      bookingUrl: "https://www.booking.com",
    },
    {
      name: "Riverside Retreat",
      type: "Luxury",
      pricePerNight: 6500,
      location: `${destination} Riverside`,
      amenities: "Pool, spa, dining",
      bookingUrl: "https://www.booking.com",
    },
    {
      name: "Skyline Suites",
      type: "Mid-range",
      pricePerNight: 4200,
      location: `${destination} Downtown`,
      amenities: "WiFi, gym, lounge",
      bookingUrl: "https://www.booking.com",
    },
    {
      name: "Heritage Stay",
      type: "Mid-range",
      pricePerNight: 3900,
      location: `${destination} Old City`,
      amenities: "Breakfast, heritage rooms",
      bookingUrl: "https://www.booking.com",
    },
    {
      name: "Hilltop View",
      type: "Budget",
      pricePerNight: 1800,
      location: `${destination} Viewpoint Road`,
      amenities: "WiFi, hot water",
      bookingUrl: "https://www.booking.com",
    },
  ];

  if (!budget) {
    return allHotels.map((hotel) => ({
      ...hotel,
      pricePerNight: String(hotel.pricePerNight),
    }));
  }

  const stayNights = Math.max(daysCount - 1, 1);
  const stayBudget = budget * 0.35;
  const budgetPerNight = stayBudget / stayNights;

  const matched = allHotels
    .filter((hotel) => hotel.pricePerNight <= budgetPerNight * 1.15)
    .sort((a, b) => a.pricePerNight - b.pricePerNight);

  const selected =
    matched.length > 0
      ? matched
      : [...allHotels]
          .sort((a, b) => a.pricePerNight - b.pricePerNight)
          .slice(0, 6);

  return selected.map((hotel) => ({
    ...hotel,
    pricePerNight: String(hotel.pricePerNight),
  }));
}

function buildFallbackItinerary({
  destination,
  startDate,
  endDate,
  travelers,
  budget,
  style,
  origin,
}) {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const daysCount =
    Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;

  const days = Array.from({ length: Math.max(daysCount, 1) }, (_, index) => {
    const date = new Date(startDateObj);
    date.setDate(startDateObj.getDate() + index);

    return {
      day: index + 1,
      date: formatDateISO(date),
      title: `Day ${index + 1} highlights`,
      activities: [
        {
          time: "09:00",
          activity: "Local sightseeing",
          description: `Explore top sights in ${destination}.`,
          estimatedCost: "Varies",
          location: destination,
        },
        {
          time: "14:00",
          activity: "Food and culture",
          description: "Try popular local spots and markets.",
          estimatedCost: "Varies",
          location: destination,
        },
      ],
      meals: {
        breakfast: "Local breakfast cafe",
        lunch: "Popular local restaurant",
        dinner: "Recommended dinner spot",
      },
      notes: "Flexible pacing with time for rest.",
    };
  });

  return {
    title: `${destination} ${daysCount}-day itinerary`,
    destination,
    days,
    highlights: [
      `Top attractions in ${destination}`,
      "Scenic viewpoints and landmarks",
      "Local markets and culture",
      "Signature experiences",
    ],
    estimatedTotalCost: budget ? `${budget} INR` : "Flexible",
    tips: [
      `Plan around peak hours in ${destination}.`,
      "Carry cash for small vendors.",
      "Book transport early for better prices.",
    ],
    hotels: buildBudgetAwareFallbackHotels(destination, budget, daysCount),
    restaurants: [
      {
        name: "Local Spice Kitchen",
        cuisine: "Regional",
        priceRange: "INR 500 - 900",
        rating: 4.5,
        speciality: "Signature regional thali",
        location: `${destination} Central`,
        bestFor: "Lunch",
        tipForVisit: "Arrive early to avoid peak rush.",
      },
      {
        name: "Cafe Terrace",
        cuisine: "Cafe",
        priceRange: "INR 400 - 700",
        rating: 4.3,
        speciality: "Fresh brews and desserts",
        location: `${destination} Market Area`,
        bestFor: "Cafe",
        tipForVisit: "Great for sunset views.",
      },
      {
        name: "Old Town Bistro",
        cuisine: "Fusion",
        priceRange: "INR 700 - 1200",
        rating: 4.4,
        speciality: "Chef specials",
        location: `${destination} Old City`,
        bestFor: "Dinner",
        tipForVisit: "Reserve a table on weekends.",
      },
      {
        name: "Street Flavors Hub",
        cuisine: "Street Food",
        priceRange: "INR 150 - 400",
        rating: 4.2,
        speciality: "Local snacks",
        location: `${destination} Night Market`,
        bestFor: "Snack",
        tipForVisit: "Try multiple stalls.",
      },
      {
        name: "Garden Grill",
        cuisine: "Indian",
        priceRange: "INR 600 - 1000",
        rating: 4.5,
        speciality: "Grilled platters",
        location: `${destination} Riverside`,
        bestFor: "Dinner",
        tipForVisit: "Go for outdoor seating.",
      },
      {
        name: "Morning Bowl",
        cuisine: "Breakfast",
        priceRange: "INR 250 - 500",
        rating: 4.1,
        speciality: "Hearty breakfast bowls",
        location: `${destination} Central`,
        bestFor: "Breakfast",
        tipForVisit: "Best before 9 AM.",
      },
    ],
    mustTryFoods: [
      "Signature local thali",
      "Street food sampler",
      "Regional dessert",
      "Spiced tea",
      "Seasonal produce dish",
      "Local bread and curry",
    ],
    transportInfo: {
      type: origin ? "Flight/Train/Bus" : "Local transport",
      estimatedCost: budget ? "Included in budget" : "Varies",
      bookingTip: "Book tickets early for better rates.",
    },
    weatherInfo: "Check local forecast before travel.",
    packingList: ["Comfortable shoes", "Light jacket", "Reusable bottle"],
  };
}

async function generateWithRetry(model, prompt, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      lastError = error;

      // Check if it's a rate limit error (429)
      if (
        error.message?.includes("429") ||
        error.message?.includes("Resource exhausted")
      ) {
        const waitTime = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
        logger.warn(
          `Rate limit hit, retrying in ${waitTime}ms (attempt ${i + 1}/${maxRetries})`,
        );
        await sleep(waitTime);
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  // If all retries failed
  throw lastError;
}

exports.generateItinerary = onCall(
  {
    cors: true,
    timeoutSeconds: 120,
    secrets: [GEMINI_API_KEY_SECRET],
  },
  async (request) => {
    const {
      destination,
      startDate,
      endDate,
      travelers,
      budget,
      style,
      origin,
      aiMessage,
    } = request.data;

    if (!destination || !startDate || !endDate) {
      throw new HttpsError(
        "invalid-argument",
        "Destination, start date, and end date are required.",
      );
    }

    const apiKey = getSecretValue(
      GEMINI_API_KEY_SECRET,
      "LOCAL_GEMINI_API_KEY",
    );
    if (!apiKey) {
      throw new HttpsError(
        "failed-precondition",
        "Gemini API key is not configured.",
      );
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.4,
          topP: 0.8,
          topK: 40,
        },
      });

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const days =
        Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
      const stayNights = Math.max(days - 1, 1);
      const budgetPerNight =
        budget && Number.isFinite(Number(budget))
          ? Math.round((Number(budget) * 0.35) / stayNights)
          : null;

      const prompt = `Generate a ${days}-day travel itinerary for ${destination} from ${startDate} to ${endDate} for ${travelers || 1} travelers. Budget: ${budget ? `₹${budget} INR` : "flexible"}. Style: ${style || "Relaxed"}. ${aiMessage ? `Traveler note: ${String(aiMessage).trim()}` : ""}

Return ONLY valid JSON (no markdown, no extra text) with this exact structure:
{
  "title": "string",
  "destination": "string",
  "days": [{"day": 1, "date": "YYYY-MM-DD", "title": "string", "activities": [{"time": "HH:MM", "activity": "string", "description": "string", "estimatedCost": "string", "location": "string"}], "meals": {"breakfast": "string", "lunch": "string", "dinner": "string"}, "notes": "string"}],
  "highlights": ["string"],
  "estimatedTotalCost": "string",
  "tips": ["string"],
  "hotels": [{"name": "string", "type": "Budget|Mid-range|Luxury", "pricePerNight": "number as string e.g. 3500", "location": "string", "amenities": "string", "bookingUrl": "https://www.booking.com"}],
  "restaurants": [{"name": "string", "cuisine": "string", "priceRange": "string e.g. INR 500 - 900", "rating": 4.5, "speciality": "string", "location": "string", "bestFor": "string", "tipForVisit": "string"}],
  "mustTryFoods": ["string"],
  "transportInfo": {"type": "string", "estimatedCost": "string", "bookingTip": "string"},
  "weatherInfo": "string",
  "packingList": ["string"]
}

IMPORTANT: hotels must be an array of at least 6 objects with name, type, pricePerNight, location, amenities, bookingUrl fields. restaurants must be an array of at least 6 objects with name, cuisine, priceRange, rating, speciality, location, bestFor, tipForVisit fields. Do NOT return hotels or restaurants as strings.`;

      try {
        const result = await generateWithRetry(model, prompt);
        let responseText = result.response.text().trim();
        logger.info("Raw AI response:", responseText);
        logger.info("Raw AI response length:", responseText.length);
        // Remove markdown/code blocks and extract JSON
        let cleaned = responseText
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
        logger.info("Cleaned AI response:", cleaned);
        const jsonStart = cleaned.indexOf("{");
        const jsonEnd = cleaned.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1)
          throw new Error("AI did not return a valid JSON object");
        const jsonString = cleaned.substring(jsonStart, jsonEnd + 1);
        logger.info("Extracted JSON string:", jsonString);
        // Remove any trailing non-JSON characters after the last }
        const validJson = jsonString.replace(/}[^}]*$/, "}");
        logger.info("Valid JSON string for parse:", validJson);
        let itinerary = JSON.parse(validJson);

        // Ensure minimal hotels/restaurants/mustTryFoods are present
        try {
          // Normalize hotels: convert any string entries to proper objects
          if (Array.isArray(itinerary.hotels)) {
            itinerary.hotels = itinerary.hotels
              .map((h) => {
                if (typeof h === "string") {
                  return {
                    name: h.split("(")[0].trim() || h,
                    type: "Hotel",
                    pricePerNight: "Price on request",
                    location: destination,
                    amenities: "WiFi, AC",
                    bookingUrl: "https://www.booking.com",
                  };
                }
                if (!h || typeof h !== "object") {
                  return null;
                }
                return h;
              })
              .filter(Boolean);
          }

          // Normalize restaurants: convert any string entries to proper objects
          if (Array.isArray(itinerary.restaurants)) {
            itinerary.restaurants = itinerary.restaurants
              .map((r) => {
                if (typeof r === "string") {
                  return {
                    name: r.split("(")[0].trim() || r,
                    cuisine: "Local",
                    priceRange: "Varies",
                    rating: 4.0,
                    speciality: r,
                    location: destination,
                    bestFor: "Dining",
                    tipForVisit: "Check availability before visiting.",
                  };
                }
                if (!r || typeof r !== "object") {
                  return null;
                }
                return r;
              })
              .filter(Boolean);
          }

          if (!Array.isArray(itinerary.hotels) || itinerary.hotels.length < 6) {
            // Always ensure at least 6 hotels
            const fallbackHotels = buildBudgetAwareFallbackHotels(
              destination,
              budget,
              days,
            );
            itinerary.hotels = Array.isArray(itinerary.hotels)
              ? [...itinerary.hotels, ...fallbackHotels].slice(0, 6)
              : fallbackHotels.slice(0, 6);
          } else if (itinerary.hotels.length > 6) {
            itinerary.hotels = itinerary.hotels.slice(0, 6);
          }

          if (
            !Array.isArray(itinerary.restaurants) ||
            itinerary.restaurants.length < 6
          ) {
            // Always ensure at least 6 restaurants
            const fallbackRestaurants = [
              {
                name: "Local Spice Kitchen",
                cuisine: "Regional",
                priceRange: "INR 500 - 900",
                rating: 4.5,
                speciality: "Signature regional thali",
                location: `${destination} Central`,
                bestFor: "Lunch",
                tipForVisit: "Arrive early to avoid peak rush.",
              },
              {
                name: "Cafe Terrace",
                cuisine: "Cafe",
                priceRange: "INR 400 - 700",
                rating: 4.3,
                speciality: "Fresh brews and desserts",
                location: `${destination} Market Area`,
                bestFor: "Cafe",
                tipForVisit: "Great for sunset views.",
              },
              {
                name: "Old Town Bistro",
                cuisine: "Fusion",
                priceRange: "INR 700 - 1200",
                rating: 4.4,
                speciality: "Chef specials",
                location: `${destination} Old City`,
                bestFor: "Dinner",
                tipForVisit: "Reserve a table on weekends.",
              },
              {
                name: "Street Flavors Hub",
                cuisine: "Street Food",
                priceRange: "INR 150 - 400",
                rating: 4.2,
                speciality: "Local snacks",
                location: `${destination} Night Market`,
                bestFor: "Snack",
                tipForVisit: "Try multiple stalls.",
              },
              {
                name: "Garden Grill",
                cuisine: "Indian",
                priceRange: "INR 600 - 1000",
                rating: 4.5,
                speciality: "Grilled platters",
                location: `${destination} Riverside`,
                bestFor: "Dinner",
                tipForVisit: "Go for outdoor seating.",
              },
              {
                name: "Morning Bowl",
                cuisine: "Breakfast",
                priceRange: "INR 250 - 500",
                rating: 4.1,
                speciality: "Hearty breakfast bowls",
                location: `${destination} Central`,
                bestFor: "Breakfast",
                tipForVisit: "Best before 9 AM.",
              },
            ];
            itinerary.restaurants = Array.isArray(itinerary.restaurants)
              ? [...itinerary.restaurants, ...fallbackRestaurants].slice(0, 6)
              : fallbackRestaurants.slice(0, 6);
          } else if (itinerary.restaurants.length > 6) {
            itinerary.restaurants = itinerary.restaurants.slice(0, 6);
          }

          if (
            !Array.isArray(itinerary.mustTryFoods) ||
            itinerary.mustTryFoods.length === 0
          ) {
            itinerary.mustTryFoods = [
              "Signature local thali",
              "Street food sampler",
              "Regional dessert",
            ];
          }
          // Ensure every activity has real text
          if (Array.isArray(itinerary.days)) {
            itinerary.days.forEach((day, i) => {
              // If activities is missing, not an array, or empty, add a default activity
              if (
                !Array.isArray(day.activities) ||
                day.activities.length === 0
              ) {
                day.activities = [
                  {
                    time: "09:00",
                    activity: `Sightseeing in ${destination}`,
                    description: `Explore local attractions in ${destination}.`,
                    estimatedCost: "Varies",
                    location: destination,
                  },
                ];
              } else {
                // If activities exist, ensure each has real text
                let allInvalid = true;
                day.activities.forEach((activity, j) => {
                  if (!activity || typeof activity !== "object") {
                    day.activities[j] = {
                      time: "09:00",
                      activity: `Sightseeing in ${destination}`,
                      description: `Explore local attractions in ${destination}.`,
                      estimatedCost: "Varies",
                      location: destination,
                    };
                    return;
                  }
                  if (!activity.activity || !activity.activity.trim()) {
                    activity.activity = `Sightseeing in ${destination}`;
                  }
                  if (!activity.description || !activity.description.trim()) {
                    activity.description = `Explore local attractions in ${destination}.`;
                  }
                  if (
                    activity.activity.trim() !== "" ||
                    activity.description.trim() !== ""
                  ) {
                    allInvalid = false;
                  }
                });
                // If all activities are still invalid, replace with one default
                if (allInvalid) {
                  day.activities = [
                    {
                      time: "09:00",
                      activity: `Sightseeing in ${destination}`,
                      description: `Explore local attractions in ${destination}.`,
                      estimatedCost: "Varies",
                      location: destination,
                    },
                  ];
                }
              }
            });
          }
        } catch (e) {
          // If anything goes wrong, silently continue with whatever the AI returned
          logger.warn("Fallback merge failed:", e);
        }

        return { ok: true, itinerary };
      } catch (err) {
        logger.error("AI itinerary failed, using fallback.", err);
        const fallback = buildFallbackItinerary({
          destination,
          startDate,
          endDate,
          travelers,
          budget,
          style,
          origin,
        });
        return {
          ok: true,
          itinerary: fallback,
          fallback: true,
          error: err.message || "AI itinerary failed",
        };
      }
    } catch (err) {
      logger.error("Itinerary generation error:", err);

      if (process.env.FUNCTIONS_EMULATOR === "true") {
        const fallback = buildFallbackItinerary({
          destination,
          startDate,
          endDate,
          travelers,
          budget,
          style,
          origin,
        });
        return { ok: true, itinerary: fallback, fallback: true };
      }

      throw new HttpsError(
        "internal",
        `Failed to generate itinerary: ${err.message}`,
      );
    }
  },
);

exports.generatePDF = onCall(
  {
    cors: true,
  },
  async (request) => {
    const { itinerary } = request.data;

    if (!itinerary) {
      throw new HttpsError("invalid-argument", "Itinerary data is required.");
    }

    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        logger.info("PDF generation complete");
      });

      const safeText = (value, fallback = "") =>
        String(value ?? fallback)
          .replace(/\s+/g, " ")
          .trim();

      const writeSectionTitle = (title) => {
        doc.moveDown(1);
        doc.fontSize(16).fillColor("#1d4ed8").text(safeText(title), {
          align: "left",
        });
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor("#000000");
      };

      const writeBullet = (text, indent = 14) => {
        doc
          .fontSize(11)
          .fillColor("#000000")
          .text(`• ${safeText(text)}`, {
            align: "left",
            indent,
            lineGap: 3,
          });
      };

      const writeLabelValue = (label, value) => {
        if (!value) {
          return;
        }
        doc
          .fontSize(11)
          .fillColor("#000000")
          .text(`${label}: ${safeText(value)}`, {
            align: "left",
            lineGap: 3,
          });
      };

      // Add header
      doc
        .fontSize(24)
        .fillColor("#4da6ff")
        .text(itinerary.title || "Travel Itinerary", { align: "center" });

      doc.moveDown();
      doc
        .fontSize(12)
        .fillColor("#666666")
        .text(`Destination: ${itinerary.destination}`, { align: "center" });

      doc.text(`Duration: ${itinerary.days?.length || 0} Days`, {
        align: "center",
      });
      doc.text(`Estimated Budget: ${itinerary.estimatedTotalCost}`, {
        align: "center",
      });

      if (
        Array.isArray(itinerary.highlights) &&
        itinerary.highlights.length > 0
      ) {
        writeSectionTitle("Trip Highlights");
        itinerary.highlights
          .slice(0, 8)
          .forEach((highlight) => writeBullet(highlight));
      }

      if (Array.isArray(itinerary.days) && itinerary.days.length > 0) {
        writeSectionTitle("Day-wise Plan");
        itinerary.days.forEach((day, index) => {
          const dayLabel = safeText(day?.title, `Day ${index + 1}`);
          const dayDate = day?.date ? ` (${safeText(day.date)})` : "";
          doc.fontSize(13).fillColor("#0f172a").text(`${dayLabel}${dayDate}`, {
            align: "left",
            lineGap: 3,
          });

          if (Array.isArray(day?.activities) && day.activities.length > 0) {
            day.activities.forEach((activity) => {
              const time = activity?.time
                ? `${safeText(activity.time)} - `
                : "";
              const title = safeText(activity?.activity, "Activity");
              const description = activity?.description
                ? `: ${safeText(activity.description)}`
                : "";
              const cost = activity?.estimatedCost
                ? ` (Cost: ${safeText(activity.estimatedCost)})`
                : "";
              writeBullet(`${time}${title}${description}${cost}`);
            });
          }

          if (day?.meals) {
            writeLabelValue("Breakfast", day.meals.breakfast);
            writeLabelValue("Lunch", day.meals.lunch);
            writeLabelValue("Dinner", day.meals.dinner);
          }

          if (day?.notes) {
            writeLabelValue("Notes", day.notes);
          }

          doc.moveDown(0.35);
        });
      }

      if (Array.isArray(itinerary.hotels) && itinerary.hotels.length > 0) {
        writeSectionTitle("Hotel Suggestions");
        itinerary.hotels.slice(0, 6).forEach((hotel) => {
          const name = safeText(hotel?.name, "Hotel");
          const type = hotel?.type ? ` | ${safeText(hotel.type)}` : "";
          const price = hotel?.pricePerNight
            ? ` | ₹${safeText(hotel.pricePerNight)}/night`
            : "";
          writeBullet(`${name}${type}${price}`);
          writeLabelValue("Location", hotel?.location);
          writeLabelValue("Amenities", hotel?.amenities);
          doc.moveDown(0.2);
        });
      }

      if (
        Array.isArray(itinerary.restaurants) &&
        itinerary.restaurants.length > 0
      ) {
        writeSectionTitle("Food Recommendations");
        itinerary.restaurants.slice(0, 8).forEach((restaurant) => {
          const line = [
            safeText(restaurant?.name, "Restaurant"),
            restaurant?.cuisine ? safeText(restaurant.cuisine) : null,
            restaurant?.speciality
              ? `Speciality: ${safeText(restaurant.speciality)}`
              : null,
          ]
            .filter(Boolean)
            .join(" | ");
          writeBullet(line);
          writeLabelValue("Price Range", restaurant?.priceRange);
          writeLabelValue("Location", restaurant?.location);
          doc.moveDown(0.2);
        });
      }

      if (Array.isArray(itinerary.tips) && itinerary.tips.length > 0) {
        writeSectionTitle("Travel Tips");
        itinerary.tips.slice(0, 8).forEach((tip) => writeBullet(tip));
      }

      if (itinerary.transportInfo) {
        writeSectionTitle("Transport");
        writeLabelValue("Type", itinerary.transportInfo.type);
        writeLabelValue(
          "Estimated Cost",
          itinerary.transportInfo.estimatedCost,
        );
        writeLabelValue("Booking Tip", itinerary.transportInfo.bookingTip);
      }

      if (itinerary.weatherInfo) {
        writeSectionTitle("Weather");
        doc
          .fontSize(11)
          .fillColor("#000000")
          .text(safeText(itinerary.weatherInfo), {
            align: "left",
            lineGap: 4,
          });
      }

      if (
        Array.isArray(itinerary.packingList) &&
        itinerary.packingList.length > 0
      ) {
        writeSectionTitle("Packing Checklist");
        itinerary.packingList.slice(0, 12).forEach((item) => writeBullet(item));
      }

      // Finalize PDF
      doc.end();

      // Wait for all chunks
      await new Promise((resolve) => {
        doc.on("end", resolve);
      });

      const pdfBuffer = Buffer.concat(chunks);
      const pdfBase64 = pdfBuffer.toString("base64");

      return {
        ok: true,
        pdf: pdfBase64,
        filename: `${itinerary.destination.replace(/\s+/g, "-")}-itinerary.pdf`,
      };
    } catch (err) {
      logger.error("PDF generation error:", err);
      throw new HttpsError(
        "internal",
        `Failed to generate PDF: ${err.message}`,
      );
    }
  },
);
