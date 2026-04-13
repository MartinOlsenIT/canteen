# Canteen Website

A simple static canteen website scaffold with Firebase integration for menu and orders.

## Files

- `index.html` — website structure and content.
- `styles/styles.css` — page styling.
- `scripts/firebase-config.js` — Firebase project config and initialization.
- `scripts/app.js` — menu loading and order submission logic.

## Setup

1. Create a Firebase project at https://console.firebase.google.com.
2. Add a Web app to the project and copy the Firebase config values.
3. Replace the placeholder values in `scripts/firebase-config.js`.
4. Add Firestore collections named `menu` and `orders`.

## How to use

Open `index.html` in a browser, or host with Firebase Hosting if you want a production site.

## Optional Firebase Hosting

If you use Firebase Hosting, add a `firebase.json` and `.firebaserc` file, then run:

```bash
firebase init hosting
firebase deploy
```
