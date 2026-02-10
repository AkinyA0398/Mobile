import { canLogin, resetAttempts, handleFailure, getLoginParams } from "./attemptService";

const FIREBASE_API_KEY = "AIzaSyCWwCxN_mJ35ClzQ_3I9LFEbH5-vdkiI3Q";

interface FirebaseLoginResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email: string;
}

/**
 * Login avec email/mot de passe et création de session Firebase
 */
export async function loginWithFirebase(email: string, password: string) {
  const canLoginUser = await canLogin(email);
  if (!canLoginUser) throw new Error("Compte bloqué");

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    await handleFailure(email);
    throw new Error(data.error?.message || "Mot de passe ou email incorrect");
  }

  await resetAttempts(email);

  const { sessionDuration } = await getLoginParams();
  const expiresAt = Date.now() + sessionDuration * 1000;
  localStorage.setItem('expiresAt', expiresAt.toString());


  return {
    ...data,
  } as FirebaseLoginResponse;
}
