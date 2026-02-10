<template>
    <ion-page>
        <ion-header>
            <ion-toolbar class="toolbar-modern">
                <ion-buttons slot="start">
                    <ion-button @click="router.push('/map')">
                        <ion-icon :icon="arrowBackOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>Nouveau signalement</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="add-report-content">
            <div class="form-wrapper">
                <!-- Section Détails -->
                <div class="form-card">
                    <h2 class="section-title">Détails du problème</h2>

                    <!-- Type de signalement -->
                    <div class="floating-field" :class="{ 'has-value': reportType }">
                        <select v-model="reportType" id="reportType" class="custom-select">
                            <option value="" disabled hidden></option>
                            <option value="pothole">Nid de poule</option>
                            <option value="crack">Fissure routière</option>
                            <option value="sinkhole">Affaissement</option>
                            <option value="damaged-surface">Surface endommagée</option>
                            <option value="other">Autre</option>
                        </select>
                        <label for="reportType">Type de problème *</label>
                    </div>

                    <!-- Entreprise concernée -->
                    <div class="floating-field" :class="{ 'has-value': company }">
                        <select v-model="company" id="company" class="custom-select">
                            <option value="" disabled hidden></option>
                            <option value="road-repairs">TANROAD</option>
                            <option value="construction-pro">Colas Madagascar</option>
                            <option value="city-works">Madarail</option>
                            <option value="municipal">Services Municipaux</option>
                        </select>
                        <label for="company">Entreprise concernée *</label>
                    </div>

                    <!-- Surface + Budget -->
                    <div class="input-row">
                        <div class="floating-field" :class="{ 'has-value': surfaceArea }">
                            <input v-model="surfaceArea" type="number" id="surfaceArea" placeholder=" " min="0" />
                            <label for="surfaceArea">Surface affectée (m²) *</label>
                        </div>

                        <div class="floating-field" :class="{ 'has-value': budget }">
                            <input v-model="budget" type="number" id="budget" placeholder=" " min="0" />
                            <label for="budget">Budget estimé (MGA)</label>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="floating-field textarea-field" :class="{ 'has-value': description }">
                        <textarea v-model="description" id="description" rows="4" placeholder=" "></textarea>
                        <label for="description">Description détaillée</label>
                    </div>
                </div>

                <!-- Section Localisation -->
                <div class="form-card">
                    <h2 class="section-title">Localisation</h2>
                    <p class="hint">Touchez la carte pour placer le marqueur</p>

                    <div id="add-map" class="mini-map"></div>

                    <div v-if="selectedLocation" class="location-info">
                        <ion-icon :icon="locationOutline"></ion-icon>
                        <span>Lat: {{ selectedLocation.lat.toFixed(5) }} • Lng: {{ selectedLocation.lng.toFixed(5)
                        }}</span>
                    </div>
                </div>

                <!-- Section Photos -->
                <div class="form-card">
                    <h2 class="section-title">Photos</h2>

                    <div class="photos-container">
                        <div v-for="(photo, index) in photos" :key="index" class="photo-preview">
                            <img :src="photo" alt="Photo" />
                            <button class="remove-btn" @click="removePhoto(index)">
                                <ion-icon :icon="closeCircleOutline"></ion-icon>
                            </button>
                        </div>

                        <!-- Menu pour choisir la source de la photo -->
                        <div class="add-photo-menu" @click="showPhotoSourceOptions">
                            <div class="add-photo-card">
                                <ion-icon :icon="cameraOutline"></ion-icon>
                                <span>Ajouter photo(s)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div class="action-group">
                    <ion-button expand="block" class="submit-btn" :disabled="!canSubmit" @click="submitReport">
                        <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
                        Soumettre le signalement
                    </ion-button>

                    <ion-button expand="block" fill="clear" color="medium" @click="router.push('/map')">
                        Annuler
                    </ion-button>
                </div>
            </div>
        </ion-content>

        <!-- Modal pour choisir la source de la photo -->
        <ion-modal :is-open="showPhotoModal" @didDismiss="showPhotoModal = false" :initial-breakpoint="0.4"
            :breakpoints="[0, 0.4]">
            <ion-content class="photo-modal-content">
                <div class="modal-header">
                    <h3>Choisir une source</h3>
                    <ion-button fill="clear" @click="showPhotoModal = false">
                        <ion-icon :icon="closeOutline"></ion-icon>
                    </ion-button>
                </div>

                <div class="photo-options">
                    <button class="photo-option" @click="takePhoto">
                        <div class="option-icon camera">
                            <ion-icon :icon="cameraOutline"></ion-icon>
                        </div>
                        <div class="option-content">
                            <h4>Prendre une photo</h4>
                            <p>Utiliser l'appareil photo</p>
                        </div>
                    </button>

                    <button class="photo-option" @click="chooseFromGallery">
                        <div class="option-icon gallery">
                            <ion-icon :icon="imagesOutline"></ion-icon>
                        </div>
                        <div class="option-content">
                            <h4>Choisir dans la galerie</h4>
                            <p>Sélectionner depuis vos photos</p>
                        </div>
                    </button>
                </div>
            </ion-content>
        </ion-modal>
    </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { resizeAndCompressImage, filesToBase64 } from "@/services/imageService";
import { creerSignalement } from "@/services/signalementService";
import { useRouter } from 'vue-router'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonModal,
    alertController
} from '@ionic/vue'
import {
    arrowBackOutline,
    locationOutline,
    cameraOutline,
    closeCircleOutline,
    checkmarkOutline,
    closeOutline,
    imagesOutline
} from 'ionicons/icons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()

const reportType = ref('')
const company = ref('')
const surfaceArea = ref('')
const budget = ref('')
const description = ref('')
const selectedLocation = ref(null)
const photos = ref([])
const showPhotoModal = ref(false)

let addMap = null
let marker = null

const canSubmit = computed(() => {
    return reportType.value && company.value && selectedLocation.value && surfaceArea.value > 0
})

const showPhotoSourceOptions = () => {
    showPhotoModal.value = true
}

const takePhoto = async () => {
  try {
    showPhotoModal.value = false

    const image = await Camera.getPhoto({
      quality: 80, // qualité max brute
      allowEditing: false,
      resultType: CameraResultType.Uri, // on prend Uri pour mieux manipuler
      source: CameraSource.Camera
    })

    if (image.webPath) {
      // Convertir Uri en File pour utiliser resizeAndCompressImage
      const response = await fetch(image.webPath)
      const blob = await response.blob()
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" })

      const compressed = await resizeAndCompressImage(file)
      photos.value.push(compressed)
    }
  } catch (err) {
    console.error("Camera annulée ou erreur", err)
  }
}

const chooseFromGallery = async () => {
  try {
    showPhotoModal.value = false

    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos
    })

    if (image.webPath) {
      const response = await fetch(image.webPath)
      const blob = await response.blob()
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" })

      const compressed = await resizeAndCompressImage(file)
      photos.value.push(compressed)
    }
  } catch (err) {
    console.error("Galerie annulée ou erreur", err)
  }
}

const showAlert = async (header, message) => {
    const alert = await alertController.create({
        header,
        message,
        buttons: ['OK']
    })
    await alert.present()
}

const removePhoto = (index) => {
    photos.value.splice(index, 1)
}

const submitReport = async () => {
  if (!canSubmit.value) return

  try {
    const payload = {
      description: description.value,
      surface: Number(surfaceArea.value),
      budget: budget.value ? Number(budget.value) : undefined,
      latitude: selectedLocation.value.lat,
      longitude: selectedLocation.value.lng,
      entrepriseId: company.value, 
      typeSignalement: { id: reportType.value, nom: reportType.value } 
    }

    await creerSignalement(payload, photos.value)

    const alert = await alertController.create({
      header: "Signalement envoyé",
      message: "Votre signalement a bien été transmis.",
      buttons: [{
        text: "OK",
        handler: () => router.push("/map")
      }]
    })
    await alert.present()
  } catch (err) {
    console.error("Erreur lors de l'envoi:", err)
    showAlert("Erreur", "Impossible d'envoyer le signalement.")
  }
}

onMounted(() => {
    setTimeout(() => {
        addMap = L.map('add-map').setView([-18.8792, 47.5074], 12)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(addMap)

        addMap.invalidateSize()

        addMap.on('click', (e) => {
            selectedLocation.value = e.latlng

            if (marker) addMap.removeLayer(marker)

            const icon = L.divIcon({
                className: 'custom-add-marker',
                html: `<div class="marker-pin" style="background:#3b82f6;"></div>`,
                iconSize: [38, 48],
                iconAnchor: [19, 48]
            })

            marker = L.marker(e.latlng, { icon }).addTo(addMap)
        })
    }, 200)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.add-report-content {
    --background: #0b0f19;
    font-family: 'Inter', system-ui, sans-serif;
}

.toolbar-modern {
    --background: rgba(15, 23, 42, 0.92);
    --backdrop-filter: blur(16px);
    --border-width: 0;
    --color: #cbd5e1;
}

.form-wrapper {
    padding: clamp(12px, 3vw, 24px);
    max-width: 860px;
    margin: 0 auto;
}

.form-card {
    background: rgba(30, 41, 59, 0.78);
    backdrop-filter: blur(12px);
    border-radius: clamp(12px, 2vw, 16px);
    padding: clamp(16px, 4vw, 24px);
    margin-bottom: clamp(16px, 3vw, 24px);
    border: 1px solid rgba(59, 130, 246, 0.12);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
}

.section-title {
    font-size: clamp(18px, 4vw, 20px);
    font-weight: 600;
    color: #e2e8f0;
    margin: 0 0 clamp(16px, 3vw, 20px);
}

.hint {
    font-size: clamp(13px, 3vw, 14px);
    color: #94a3b8;
    margin: 0 0 clamp(12px, 2vw, 16px);
}

/* Floating fields */
.floating-field {
    position: relative;
    margin-bottom: clamp(16px, 3vw, 24px);
}

.floating-field input,
.floating-field select,
.floating-field textarea {
    width: 100%;
    padding: clamp(14px, 3vw, 16px) clamp(14px, 3vw, 16px) clamp(8px, 2vw, 8px);
    background: rgba(51, 65, 85, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: clamp(10px, 2vw, 12px);
    color: #e2e8f0;
    font-size: clamp(15px, 3vw, 16px);
    transition: all 0.2s ease;
    box-sizing: border-box;
}

.floating-field input:focus,
.floating-field select:focus,
.floating-field textarea:focus {
    border-color: #60a5fa;
    background: rgba(51, 65, 85, 0.6);
    outline: none;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
}

.floating-field label {
    position: absolute;
    left: clamp(14px, 3vw, 16px);
    top: clamp(14px, 3vw, 16px);
    color: #94a3b8;
    font-size: clamp(15px, 3vw, 16px);
    pointer-events: none;
    transition: all 0.2s ease;
    background: transparent;
    padding: 0 4px;
}

.floating-field.has-value label,
.floating-field input:focus+label,
.floating-field select:focus+label,
.floating-field textarea:focus+label {
    top: -8px;
    font-size: clamp(12px, 2.5vw, 13px);
    color: #60a5fa;
    background: rgba(51, 65, 85, 0.9);
    border-radius: 4px;
}

.textarea-field textarea {
    min-height: clamp(100px, 20vh, 140px);
    resize: vertical;
}

/* Row inputs */
.input-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: clamp(12px, 2vw, 16px);
}

@media (max-width: 480px) {
    .input-row {
        grid-template-columns: 1fr;
    }
}

/* Mini map */
.mini-map {
    height: clamp(200px, 40vh, 320px);
    border-radius: clamp(10px, 2vw, 12px);
    overflow: hidden;
    border: 1px solid #334155;
    background: #0f172a;
    margin: clamp(8px, 2vw, 12px) 0;
    min-height: 180px;
}

.location-info {
    display: flex;
    align-items: center;
    gap: clamp(8px, 2vw, 10px);
    padding: clamp(10px, 2vw, 12px);
    background: rgba(59, 130, 246, 0.12);
    border-radius: clamp(10px, 2vw, 12px);
    color: #60a5fa;
    font-size: clamp(13px, 2.5vw, 14px);
    margin-top: clamp(8px, 2vw, 12px);
    flex-wrap: wrap;
    word-break: break-word;
}

.location-info ion-icon {
    font-size: clamp(16px, 3vw, 18px);
    flex-shrink: 0;
}

/* Photos container */
.photos-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(clamp(90px, 15vw, 130px), 1fr));
    gap: clamp(10px, 2vw, 12px);
}

.photo-preview {
    position: relative;
    aspect-ratio: 1;
    border-radius: clamp(10px, 2vw, 12px);
    overflow: hidden;
    border: 1px solid #334155;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.photo-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.remove-btn {
    position: absolute;
    top: clamp(4px, 1vw, 6px);
    right: clamp(4px, 1vw, 6px);
    background: rgba(239, 68, 68, 0.9);
    border: none;
    border-radius: 50%;
    width: clamp(24px, 5vw, 28px);
    height: clamp(24px, 5vw, 28px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    font-size: clamp(14px, 3vw, 16px);
}

.add-photo-menu {
    cursor: pointer;
}

.add-photo-card {
    aspect-ratio: 1;
    border: 2px dashed #334155;
    border-radius: clamp(10px, 2vw, 12px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(6px, 1.5vw, 8px);
    color: #94a3b8;
    transition: all 0.2s ease;
    padding: clamp(8px, 2vw, 12px);
    box-sizing: border-box;
    height: 100%;
}

.add-photo-card:hover {
    border-color: #60a5fa;
    color: #60a5fa;
    background: rgba(59, 130, 246, 0.08);
}

.add-photo-card ion-icon {
    font-size: clamp(28px, 6vw, 36px);
}

.add-photo-card span {
    font-size: clamp(12px, 2.5vw, 13px);
    font-weight: 500;
    text-align: center;
    line-height: 1.3;
}

@media (max-width: 360px) {
    .photos-container {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Boutons d'action */
.action-group {
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 2vw, 12px);
    margin-top: clamp(24px, 5vw, 32px);
}

.submit-btn {
    --background: #3b82f6;
    --background-hover: #2563eb;
    --background-activated: #1d4ed8;
    --border-radius: clamp(10px, 2vw, 12px);
    height: clamp(48px, 8vh, 56px);
    font-size: clamp(15px, 3vw, 16px);
    font-weight: 600;
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
}

.submit-btn:disabled {
    --background: #334155;
    --color: #64748b;
    box-shadow: none;
}

/* Marqueur personnalisé */
.custom-add-marker .marker-pin {
    width: clamp(28px, 5vw, 32px);
    height: clamp(28px, 5vw, 32px);
    background: #3b82f6;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
}

/* Modal pour choisir la source de la photo */
.photo-modal-content {
    --background: #1e293b;
    font-family: 'Inter', system-ui, sans-serif;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 10px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.modal-header h3 {
    margin: 0;
    color: #e2e8f0;
    font-size: 18px;
    font-weight: 600;
}

.modal-header ion-button {
    --color: #94a3b8;
    --padding-start: 8px;
    --padding-end: 8px;
}

.photo-options {
    padding: 16px 20px 24px;
}

.photo-option {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 18px 16px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #e2e8f0;
    text-align: left;
}

.photo-option:last-child {
    margin-bottom: 0;
}

.photo-option:hover {
    background: rgba(51, 65, 85, 0.8);
    border-color: #60a5fa;
    transform: translateY(-2px);
}

.option-icon {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    flex-shrink: 0;
}

.option-icon.camera {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
}

.option-icon.gallery {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.option-icon ion-icon {
    font-size: 28px;
}

.option-content h4 {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 600;
    color: #e2e8f0;
}

.option-content p {
    margin: 0;
    font-size: 14px;
    color: #94a3b8;
}
</style>