import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// 1. IMPORTAR AUTENTICACIÓN
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDFOn2SWRyHlcu2SHOPo4GoTuTgekPsbc0",
  authDomain: "infielesdr.firebaseapp.com",
  projectId: "infielesdr",
  storageBucket: "infielesdr.firebasestorage.app",
  messagingSenderId: "157592371304",
  appId: "1:157592371304:web:d242187ee9a4a378ef7bdd",
  measurementId: "G-LRDF10B8BH"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// 2. EXPORTAR EL OBJETO DE AUTENTICACIÓN
export const auth = getAuth(app);
