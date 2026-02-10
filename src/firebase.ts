// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence,
  signInWithCustomToken
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCWwCxN_mJ35ClzQ_3I9LFEbH5-vdkiI3Q",
  authDomain: "projet-cloud-88fd6.firebaseapp.com",
  projectId: "projet-cloud-88fd6",
  storageBucket: "projet-cloud-88fd6.firebasestorage.app",
  messagingSenderId: "662417470233",
  appId: "1:662417470233:web:bb10af6448de03e1f8cb88",
  measurementId: "G-HP4DK4WLM2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Persistence activée");
  })
  .catch((error) => {
    console.error("Erreur de persistance:", error);
  });

export async function restoreAuthFromStorage() {
  const idToken = localStorage.getItem('firebaseIdToken');
  
  if (!idToken) return null;
  
  try {
    if (auth.currentUser) {
      const refreshedToken = await auth.currentUser.getIdToken(true);
      localStorage.setItem('firebaseIdToken', refreshedToken);
      return auth.currentUser;
    }
    
    
    return null;
  } catch (error) {
    console.error("Erreur restauration auth:", error);
    localStorage.removeItem('firebaseIdToken');
    localStorage.removeItem('isAuthenticated');
    return null;
  }
}