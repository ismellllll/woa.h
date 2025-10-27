// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD_n7YhROmVMy31n9FknlsvhG9E8ZzJSTY",
  authDomain: "ghostriderjunior-7e2f2.firebaseapp.com",
  projectId: "ghostriderjunior-7e2f2",
  storageBucket: "ghostriderjunior-7e2f2.firebasestorage.app",
  messagingSenderId: "1012485967093",
  appId: "1:1012485967093:web:cd6d9ccfa166c78447c9bc",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app); // 👈 add this line


