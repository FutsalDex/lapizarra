
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "lapizarra-95eqd",
  "appId": "1:303306895935:web:62f8aa8ac48080caccfe8a",
  "storageBucket": "lapizarra-95eqd.firebasestorage.app",
  "apiKey": "AIzaSyDzMpL1f8w2n1t_OfIyfbf10LXTVmCIvCM",
  "authDomain": "lapizarra-95eqd.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "303306895935"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
