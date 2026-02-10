import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function checkAuth(): Promise<boolean> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        user.getIdToken().then(token => {
          localStorage.setItem('firebaseIdToken', token);
          localStorage.setItem('isAuthenticated', 'true');
        });
        resolve(true);
      } else {
        localStorage.removeItem('firebaseIdToken');
        localStorage.removeItem('isAuthenticated');
        resolve(false);
      }
      const expiresAt = Number(localStorage.getItem('expiresAt') || 0);

      if (Date.now() > expiresAt) {
        localStorage.removeItem('firebaseIdToken');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('isAuthenticated');
        resolve(false);
      }
    });
  });
}

export function getCurrentUser() {
  return auth.currentUser;
}

export const logout = async () => {
  try {
    await auth.signOut();
    localStorage.removeItem('firebaseIdToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('sessionExpiresAt'); 
  } catch (error) {
    console.error("Erreur déconnexion:", error);
    alert("Impossible de se déconnecter, réessayez.");
  }
};