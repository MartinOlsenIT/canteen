import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyA1z2SGGkm3ZoebbNwFefWScnsQ6gUpc2Y",
  authDomain: "kantine-nettside-ac8f3.firebaseapp.com",
  projectId: "kantine-nettside-ac8f3",
  storageBucket: "kantine-nettside-ac8f3.firebasestorage.app",
  messagingSenderId: "414728305856",
  appId: "1:414728305856:web:6609ae35d86d4ceb118125",
  measurementId: "G-FL2Y66HD6H"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();