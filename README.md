# 🌍 Planora AI – Smart Travel Planner

> An AI-powered full-stack travel planner that generates personalized day-by-day itineraries using Google Gemini API, with secure user authentication and cloud-based trip storage.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge&logo=vercel)](https://planora-ai-three.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-black?style=for-the-badge&logo=github)](https://github.com/shubhra2604/Planora-AI)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev/)
[![ReactBits](https://img.shields.io/badge/React%20Bits-UI%20Components-FF6B6B?style=for-the-badge&logo=react)](https://reactbits.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Gemini%20API-Google%20AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

---

## ✨ Features

### 🔐 Authentication
- Secure login/signup using **Firebase Authentication**

### 🤖 AI Itinerary Generation (Gemini API)
- Generates detailed **day-by-day travel plans** including:
  - 📍 Must-visit places
  - 🏨 Hotels & restaurants
  - 💡 Travel tips
  - 💰 Budget estimation

### 🧾 Trip Management
- Save and retrieve itineraries per user
- Persistent storage using **Firestore**

### 📄 Export & Feedback
- Download itinerary as **PDF**
- Built-in **feedback system**

### 🎯 Smart Inputs
- Source, destination, budget, travel style
- Custom instructions (e.g., hidden gems, veg food, etc.)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, CSS (Glassmorphism UI) |
| UI Components | [React Bits](https://reactbits.dev/) (Animated UI Components) |
| Authentication | Firebase Authentication |
| Database | Firebase Firestore |
| AI | Gemini API (Google AI) |
| Deployment | Vercel |

---

## 🧠 How It Works

```
User Input → Gemini API → Structured Itinerary → UI Display → Firestore Storage
```

1. **User enters trip details** — destination, dates, budget, preferences
2. **Data is sent to Gemini API**
3. **Gemini generates a structured itinerary:**
   - Day-by-day plan
   - Hotels & food suggestions
   - Travel tips & logistics
4. **Response is parsed and displayed** in the UI
5. **Trip is stored in Firestore** under:

```
users/{uid}/trips/{tripId}
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js ≥ 18
- A Firebase project
- A Google Gemini API key

### Installation

```bash
git clone https://github.com/shubhra2604/Planora-AI.git
cd Planora-AI
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ Never commit your `.env` file. Make sure it's listed in `.gitignore`.

---

## 🚀 Deployment

The application is deployed on **Vercel**.

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com/)
3. Add environment variables in the Vercel dashboard
4. Deploy 🎉

---

## 🔮 Future Improvements

- [ ] Google OAuth login
- [ ] Real-time pricing APIs (flights/hotels)
- [ ] Collaborative trip planning
- [ ] Mobile app version

---

## 👤 Author

**Shubhra Kiran Bid**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/shubhra-kiran-bid/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat&logo=github)](https://github.com/shubhra2604)

---

## ⭐ Acknowledgements

- [Google Gemini API](https://ai.google.dev/)
- [Firebase](https://firebase.google.com/)
- [React Bits](https://reactbits.dev/) — Animated UI components for React
- [Vercel](https://vercel.com/)

---

> If you found this project helpful, consider giving it a ⭐ on [GitHub](https://github.com/shubhra2604/Planora-AI)!
