<template>
  <ion-page>
    <ion-content :fullscreen="true" class="auth-content">
      <div class="auth-wrapper">
        <div class="header-section">
          <div class="logo-container">
            <!-- Icône bouclier + route + point d'alerte -->
            <ion-icon :icon="shieldCheckmark" class="shield-icon"></ion-icon>
            <div class="alert-dot"></div>
          </div>
          <h1 class="app-title">SignalRoute</h1>
          <p class="app-subtitle">Signalez rapidement les dangers routiers</p>
        </div>

        <div class="form-card">
          <h2 class="form-title">Connexion sécurisée</h2>

          <div class="input-group">
            <div class="floating-field" :class="{ 'has-value': email, 'is-focused': emailFocused }">
              <ion-icon :icon="mailOutline" class="field-icon"></ion-icon>
              <input
                v-model="email"
                type="email"
                id="email"
                autocomplete="email"
                @focus="emailFocused = true"
                @blur="emailFocused = false"
              />
              <label for="email" :class="{ 'active': emailFocused || email }">Adresse email</label>
            </div>

            <div class="floating-field" :class="{ 'has-value': password, 'is-focused': passwordFocused }">
              <ion-icon :icon="lockClosedOutline" class="field-icon"></ion-icon>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                id="password"
                autocomplete="current-password"
                @focus="passwordFocused = true"
                @blur="passwordFocused = false"
              />
              <label for="password" :class="{ 'active': passwordFocused || password }">Mot de passe</label>
              <ion-icon
                :icon="showPassword ? eyeOffOutline : eyeOutline"
                class="password-toggle"
                @click="showPassword = !showPassword"
              ></ion-icon>
            </div>
          </div>

          <ion-button expand="block" fill="solid" class="login-btn" @click="handleSignIn">
            Se connecter
          </ion-button>

          <div class="forgot-password">
            <a href="#" @click.prevent>Mot de passe oublié ?</a>
          </div>

          <div class="divider">
            <span>ou</span>
          </div>

          <div class="social-group">
            <button class="social-btn google">
              <ion-icon :icon="logoGoogle"></ion-icon>
              Continuer avec Google
            </button>
          </div>
        </div>

        <div class="footer-text">
          © {{ new Date().getFullYear() }} SignalRoute – Sécurité routière collaborative
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginWithFirebase } from '@/services/firebaseAuth'
import { auth } from "@/firebase"
import { onMounted } from 'vue'
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/vue'
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  logoGoogle,
  shieldCheckmark
} from 'ionicons/icons'

const router = useRouter()
const email = ref('')
const password = ref('')
const emailFocused = ref(false)
const passwordFocused = ref(false)
const showPassword = ref(false)

onMounted(() => {
  const token = localStorage.getItem('firebaseIdToken');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (token && isAuthenticated) {
    router.push('/map');
  }
});

const handleSignIn = async () => {
  try {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    
    const idToken = await userCredential.user.getIdToken();
    
    localStorage.setItem('firebaseIdToken', idToken);
    localStorage.setItem('isAuthenticated', 'true');
    
    router.push('/map');
    
  } catch (err) {
    let message = 'Erreur de connexion';
    
    switch (err.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = 'Email ou mot de passe incorrect';
        break;
      case 'auth/too-many-requests':
        message = 'Trop de tentatives. Réessayez plus tard';
        break;
      case 'auth/user-disabled':
        message = 'Compte désactivé';
        break;
    }
    
    alert(message);
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.auth-content {
  --background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  font-family: 'Inter', system-ui, sans-serif;
}

.auth-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
  padding: 40px 24px;
  color: #f1f5f9;
}

.header-section {
  text-align: center;
  margin: 40px 0 60px;
}

.logo-container {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 16px;
}

.shield-icon {
  font-size: 100px;
  color: #3b82f6;
}

.alert-dot {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  background: #ef4444;
  border: 3px solid #0f172a;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  color: #e2e8f0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 15px;
  color: #94a3b8;
  margin: 8px 0 0;
}

.form-card {
  background: rgba(30, 41, 59, 0.92);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 40px 28px;
  width: 100%;
  max-width: 420px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.form-title {
  font-size: 24px;
  font-weight: 600;
  color: #e2e8f0;
  text-align: center;
  margin: 0 0 32px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 28px;
}

.floating-field {
  position: relative;
}

.floating-field input {
  width: 100%;
  padding: 16px 20px 16px 52px;
  background: rgba(51, 65, 85, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 16px;
  transition: all 0.25s ease;
}

.floating-field.is-focused input {
  border-color: #60a5fa;
  background: rgba(51, 65, 85, 0.8);
  outline: none;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
}

.field-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 22px;
  color: #94a3b8;
  pointer-events: none;
  transition: color 0.25s ease;
}

.floating-field.is-focused .field-icon {
  color: #60a5fa;
}

.password-toggle {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 22px;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.25s ease;
}

.floating-field.is-focused .password-toggle {
  color: #60a5fa;
}

label {
  position: absolute;
  left: 52px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 16px;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 2px 6px;
  background: transparent;
  border-radius: 6px;
  transform-origin: left center;
  will-change: transform, top, left, font-size;
  z-index: 1;
}

label.active {
  top: -12px;
  left: 12px;
  font-size: 13px;
  color: #60a5fa;
  padding: 4px 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
  backdrop-filter: blur(3px);
  transform: translateY(0) scale(0.95);
}

.floating-field.is-focused label:not(.active) {
  color: #60a5fa;
}

.login-btn {
  --background: #3b82f6;
  --background-hover: #2563eb;
  --background-activated: #1d4ed8;
  --border-radius: 12px;
  height: 56px;
  font-size: 17px;
  font-weight: 600;
  text-transform: none;
  margin: 0 0 16px;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
}

.forgot-password {
  text-align: center;
  margin: 12px 0 24px;
}

.forgot-password a {
  color: #60a5fa;
  font-size: 14px;
  text-decoration: none;
}

.forgot-password a:hover {
  text-decoration: underline;
}

.divider {
  display: flex;
  align-items: center;
  margin: 28px 0;
  color: #64748b;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(148, 163, 184, 0.2);
}

.divider span {
  padding: 0 16px;
  font-size: 14px;
}

.social-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px;
  background: rgba(51, 65, 85, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  color: #e2e8f0;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.social-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  border-color: #64748b;
}

.social-btn ion-icon {
  font-size: 24px;
}

.google {
  color: #f87171;
}

.footer-text {
  margin-top: auto;
  padding: 32px 0 16px;
  color: #64748b;
  font-size: 13px;
  text-align: center;
}
</style>