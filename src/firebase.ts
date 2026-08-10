import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAwtwdj3eyWl12DNh1Evsot9kICaj4c3PU",
  authDomain: "confia-b952e.firebaseapp.com",
  projectId: "confia-b952e",
  storageBucket: "confia-b952e.firebasestorage.app",
  messagingSenderId: "17848512981",
  appId: "1:17848512981:web:d85b616497375d7ac20d5c",
  measurementId: "G-L2W2N859J0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export { signInAnonymously };
