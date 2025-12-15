import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- DEBUGGING (Borrar esto luego) ---
console.log("Intentando leer API KEY:", import.meta.env.VITE_API_KEY);
// ------------------------------------

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// Validación extra antes de iniciar
if (!firebaseConfig.apiKey) {
  console.error("CRITICAL ERROR: API KEY IS MISSING IN FIREBASE CONFIG");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };