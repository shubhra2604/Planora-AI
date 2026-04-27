🚀 Planora AI – Smart Travel Planner

Planora AI is a full-stack AI-powered travel planning web application that helps users generate personalized itineraries, manage trips, and store travel data securely.

🔗 Live Demo: https://planora-ai-three.vercel.app

📦 GitHub Repo: https://github.com/shubhra2604/Planora-AI

✨ Features
🔐 Authentication
Email/Password login using Firebase Auth
🤖 AI Travel Planning
Generate personalized itineraries based on user inputs
🗂️ Trip Management
Save, view, and manage trips
☁️ Cloud Storage
Firestore database for persistent storage
⚡ Fast UI
Built with React + Vite for optimized performance
🌐 Deployment Ready
Hosted on Vercel
🛠️ Tech Stack
Frontend
React (Vite)
React Router
CSS
Backend / Services
Firebase Authentication
Firebase Firestore
Firebase Functions (optional)
Deployment
Vercel
🧠 System Architecture
Frontend interacts with Firebase Authentication for login/signup

User-specific data stored in Firestore:

users/{uid}/trips/{tripId}
AI itinerary generation handled via API / logic layer
📸 Screenshots

(Add screenshots here later for stronger impact)

⚙️ Setup Instructions
1. Clone the repo
git clone https://github.com/shubhra2604/Planora-AI.git
cd Planora-AI
2. Install dependencies
npm install
3. Setup environment variables

Create a .env file:

VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_USE_FIREBASE_EMULATORS=false
4. Run locally
npm run dev
🚀 Deployment

Deployed using Vercel

Make sure:

Environment variables are configured in Vercel
Firebase rules are deployed:
firebase deploy --only firestore:rules,firestore:indexes
🔐 Firebase Notes
Authentication: Email/Password enabled
Firestore used for storing trips
Emulator support available for local development
📌 Future Improvements
Google OAuth (server-side)
AI recommendations enhancement
Trip sharing feature
Mobile responsiveness improvements
👤 Author

Shubhra Kiran Bid

LinkedIn: https://www.linkedin.com/in/shubhra-kiran-bid/
GitHub: https://github.com/shubhra2604
