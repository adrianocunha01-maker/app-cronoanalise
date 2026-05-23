// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCcJymQm0tOcacVPLkIb3MsFv_nKa0EcLk",
  authDomain: "app-cronoanalise-174c1.firebaseapp.com",
  projectId: "app-cronoanalise-174c1",
  storageBucket: "app-cronoanalise-174c1.firebasestorage.app",
  messagingSenderId: "115625648210",
  appId: "1:115625648210:web:3e9b790abfa19593bbff8b",
  measurementId: "G-N97HHWPEMZ"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
