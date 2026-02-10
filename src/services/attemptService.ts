import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_SESSION_DURATION = 3600;

export async function getLoginParams() {
  try {
    const paramDoc = await getDoc(doc(db, "parametre", "login"));
    const data = paramDoc.exists() ? paramDoc.data() : {};
    return {
      maxAttempts: Number(data.MAX_FAILED_ATTEMPTS) ?? DEFAULT_MAX_ATTEMPTS,
      sessionDuration: Number(data.SESSION_DURATION) ?? DEFAULT_SESSION_DURATION
    };
  } catch (e) {
    console.warn("Impossible de récupérer param login:", e);
    return { maxAttempts: DEFAULT_MAX_ATTEMPTS, sessionDuration: DEFAULT_SESSION_DURATION };
  }
}

// Réinitialiser les tentatives pour un utilisateur
export async function resetAttempts(email: string) {
  const userRef = doc(db, "utilisateur", email);
  try {
    await updateDoc(userRef, {
      failed_attempts: 0,
      blocked: false
    });
  } catch (e) {
    // Si le document n'existe pas, créer
    await setDoc(userRef, {
      failed_attempts: 0,
      blocked: false
    });
  }
}

// Enregistrer un échec de login
export async function handleFailure(email: string) {
  const userRef = doc(db, "utilisateur", email);
  const { maxAttempts } = await getLoginParams();

  let failedAttempts = 0;
  let blocked = false;

  try {
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      failedAttempts = data.failed_attempts ?? 0;
      blocked = data.blocked ?? false;
    }
  } catch (e) {
    console.warn("Erreur lecture utilisateur:", e);
  }

  failedAttempts += 1;
  if (failedAttempts >= maxAttempts) {
    blocked = true;
  }

  await setDoc(userRef, {
    failed_attempts: failedAttempts,
    blocked
  }, { merge: true });

  console.log(`User ${email} -> attempts: ${failedAttempts}, blocked: ${blocked}`);
}

export async function canLogin(email: string) {
  const userRef = doc(db, "utilisateur", email);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return true;

    const data = userDoc.data();
    if (!data.blocked) return true;

    return false;
  } catch (e) {
    console.warn("Erreur vérification login:", e);
    return true;
  }
}
