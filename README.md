# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Google Sign-In (Firebase)

Currently, the app uses email/password authentication via Firebase, which works reliably on any hosting platform (Vercel, Firebase Hosting, etc.).

To add Google OAuth using the redirect flow, you would need to deploy to Firebase Hosting (which serves the redirect handler automatically). Since you're planning to deploy to Vercel, you can:

1. **For now** — use email/password sign-up (already implemented).
2. **Later (production)** — add server-side Google OAuth on Vercel using a serverless function that handles the OAuth flow and mints Firebase custom tokens. This avoids the popup/redirect handler complexity.

If you want to implement server-side OAuth, reach out and I can scaffold it.

## Popup issues and Cross-Origin-Opener-Policy (COOP)

If you see errors like:

```
Cross-Origin-Opener-Policy policy would block the window.close call
```

This means the browser blocked the auth popup from calling `window.close()` because the page is COOP-isolated. What I added to this repo:

- `vite.config.js` — sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` for the Vite dev server.
- `vercel.json` — instructs Vercel to set the same header when deployed.

These headers allow popups to function, but Firebase's auth popup flow also requires the redirect handler files (served by Firebase Hosting). For Vercel, email/password or server-side OAuth is the recommended approach.

## Firebase setup (dev vs production)

Use `.env.example` as reference and create your own `.env`.

- `VITE_USE_FIREBASE_EMULATORS=true` for local emulator development
- `VITE_USE_FIREBASE_EMULATORS=false` for hosted production

The app stores trips in Firestore under `users/{uid}/trips/{tripId}`.

## Production checklist

1. Create Cloud Firestore in Firebase Console (if not already created).
2. Set Vercel/Firebase Hosting env vars from `.env.example`.
3. Set `VITE_USE_FIREBASE_EMULATORS=false` in production env.
4. Deploy Firestore security rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

5. Deploy functions (if updated):

```bash
firebase deploy --only functions
```

6. Deploy frontend and verify:
	- Login works
	- Generate itinerary works
	- `My Trips` persists across logout/login and devices
