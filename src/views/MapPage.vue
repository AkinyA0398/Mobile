<template>
    <ion-page>
        <ion-header :translucent="true">
            <ion-toolbar class="toolbar-custom">
                <div class="logo-title-container">
                    <ion-icon :icon="shieldCheckmark" class="header-logo"></ion-icon>
                    <ion-title class="toolbar-title">SignalRoute</ion-title>
                </div>
                <ion-buttons slot="end">
                    <ion-button @click="router.push('/add-report')" class="header-btn">
                        <ion-icon :icon="addCircleOutline" slot="icon-only"></ion-icon>
                    </ion-button>
                    <ion-button @click="router.push('/notifications')" class="header-btn">
                        <ion-icon :icon="notificationsOutline" slot="icon-only"></ion-icon>
                    </ion-button>
                    <ion-button class="header-btn" @click="handleLogout">
                        <ion-icon :icon="logOut" slot="icon-only"></ion-icon>
                    </ion-button>
                    <ion-button class="header-btn" @click="reloadReports">
                        <ion-icon :icon="refreshOutline" slot="icon-only"></ion-icon>
                    </ion-button>

                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">
            <!-- Summary Card (glassmorphism) -->
            <div class="summary-card">
                <div class="summary-item">
                    <div class="summary-label">Signalements</div>
                    <div class="summary-value">{{ totalPoints }}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Surface (m²)</div>
                    <div class="summary-value">{{ totalSurface }} </div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Avancement</div>
                    <div class="summary-value">{{ progress }}%</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Budget</div>
                    <div class="summary-value">{{ formatBudget(totalBudget) }}</div>
                </div>
            </div>

            <!-- Filter -->
            <div class="filter-bar">
                <ion-chip :outline="!showMyReports" :color="showMyReports ? 'primary' : 'light'"
                    @click="toggleMyReports" class="filter-chip">
                    <ion-icon :icon="filterOutline"></ion-icon>
                    <ion-label>Mes signalements</ion-label>
                </ion-chip>
            </div>

            <!-- Map -->
            <div id="map" class="map-container"></div>

            <!-- Modal détail – version améliorée -->
            <ion-modal :is-open="selectedMarker !== null" @didDismiss="selectedMarker = null" :initial-breakpoint="0.5"
                :breakpoints="[0, 0.5, 0.75, 1]" handle="true" backdrop-dismiss="true" class="gmaps-sheet">
                <ion-header class="modal-header">
                    <ion-toolbar>
                        <ion-title>Détails du signalement</ion-title>
                        <ion-buttons slot="end">
                            <ion-button @click="selectedMarker = null">
                                <ion-icon :icon="closeOutline"></ion-icon>
                            </ion-button>
                        </ion-buttons>
                    </ion-toolbar>
                </ion-header>

                <ion-content v-if="selectedMarker" class="modal-content">
                    <!-- En-tête statut + date -->
                    <div class="detail-header">
                        <ion-badge :color="getBadgeColor(selectedMarker.status)" class="status-badge large">
                            {{ selectedMarker.status }}
                        </ion-badge>
                        <div class="detail-date">{{ formatDate(selectedMarker.date) }}</div>
                    </div>

                    <!-- Informations clés -->
                    <div class="detail-info-grid">
                        <div class="info-item full" v-if="selectedMarker.address">
                            <ion-icon :icon="locationOutline" color="primary"></ion-icon>
                            <div class="info-text">
                                <div class="info-label">Localisation</div>
                                <div class="info-value">
                                    {{ selectedMarker.address.road }},
                                    {{ selectedMarker.address.suburb }},
                                    {{ selectedMarker.address.name }}
                                </div>
                            </div>
                        </div>
                        <div class="info-item">
                            <ion-icon :icon="resizeOutline" color="primary"></ion-icon>
                            <div class="info-text">
                                <div class="info-label">Surface</div>
                                <div class="info-value">{{ selectedMarker.surface }} m²</div>
                            </div>
                        </div>

                        <div class="info-item">
                            <ion-icon :icon="cashOutline" color="primary"></ion-icon>
                            <div class="info-text">
                                <div class="info-label">Budget</div>
                                <div class="info-value">{{ formatBudget(selectedMarker.budget) }}</div>
                            </div>
                        </div>

                        <div class="info-item full">
                            <ion-icon :icon="businessOutline" color="primary"></ion-icon>
                            <div class="info-text">
                                <div class="info-label">Entreprise</div>
                                <div class="info-value">{{ selectedMarker.company }}</div>
                            </div>
                        </div>
                        <div class="info-item full">
                            <ion-icon :icon="businessOutline" color="primary"></ion-icon>
                            <div class="info-text">
                                <div class="info-label">Niveau</div>
                                <div class="info-value">{{ selectedMarker.niveau }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Section photos -->
                    <div class="photos-section">
                        <h3>Photos</h3>
                        <div class="photos-grid">
                            <div v-for="(photo, i) in selectedMarker.photos" :key="i" class="photo-item">
                                <img :src="photo" alt="Photo du signalement" />
                            </div>
                        </div>
                    </div>
                </ion-content>
            </ion-modal>
        </ion-content>
    </ion-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonChip, IonLabel, IonModal, IonBadge
} from '@ionic/vue'
import {
    shieldCheckmark,
    addCircleOutline, notificationsOutline, filterOutline, closeOutline,
    logOut,refreshOutline
} from 'ionicons/icons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { listSignalements } from "@/services/signalementService"
import { auth } from "@/firebase"
import { checkAuth, getCurrentUser, logout } from '@/services/authService'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const handleLogout = async () => {
    try {
        await auth.signOut();
        await logout();
        router.push('/login');
    } catch (error) {
        console.error("Erreur déconnexion:", error);
        alert("Impossible de se déconnecter, réessayez.");
    }
};

const reports = ref([])
const router = useRouter()
const showMyReports = ref(false)
const selectedMarker = ref(null)
const isAuthenticated = ref(false)
let map = null

const filteredReports = computed(() =>
    showMyReports.value
        ? reports.value.filter(r => r.isMine)
        : reports.value
)

const progress = computed(() => {
    const completed = filteredReports.value.filter(r => r.status === 'Terminé').length
    return totalPoints.value > 0 ? Math.round((completed / totalPoints.value) * 100) : 0
})

const totalPoints = computed(() => filteredReports.value.length)
const totalSurface = computed(() => filteredReports.value.reduce((s, r) => s + r.surface, 0))
const totalBudget = computed(() => filteredReports.value.reduce((s, r) => s + r.budget, 0))

const formatBudget = (amount) => new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', maximumFractionDigits: 0 }).format(amount)
const formatDate = (date) => new Date(date).toLocaleDateString('fr-MG', { day: 'numeric', month: 'long', year: 'numeric' })

const getBadgeColor = (status) => {
    switch (status) {
        case 'Nouveau': return 'danger'
        case 'En cours': return 'warning'
        case 'Terminé': return 'success'
        default: return 'medium'
    }
}

const toggleMyReports = () => {
    showMyReports.value = !showMyReports.value
    updateMapMarkers()
}

const reloadReports = async () => {
    try {
        const user = getCurrentUser()
        const userEmail = user?.email

        const data = await listSignalements()

        reports.value = data.map(r => ({
            id: r.id,
            lat: r.geom?.latitude,
            lng: r.geom?.longitude,
            date: r.dateCreation?.seconds
                ? new Date(r.dateCreation.seconds * 1000)
                : new Date(),
            status: r.statutActuel?.nom || "Inconnu",
            surface: r.surface || 0,
            budget: r.budget || 0,
            company: r.entreprise?.nom || "Non assignée",
            photos: (r.photos || []).map(p => {
                if (!p) return null
                if (p.startsWith('data:image')) return p
                return `data:image/jpeg;base64,${p}`
            }).filter(Boolean),
            isMine: r.utilisateur?.email === userEmail
        }))

        updateMapMarkers() // 🔥 met à jour les marqueurs
    } catch (error) {
        console.error("Erreur reload:", error)
        alert("Impossible d’actualiser les données")
    }
}

const updateMapMarkers = () => {
    if (!map) return

    map.eachLayer(l => { if (l instanceof L.Marker) map.removeLayer(l) })

    filteredReports.value.forEach(report => {
        if (!report.lat || !report.lng) return

        const color = report.status === 'Nouveau' ? '#ef4444' :
            report.status === 'En cours' ? '#f59e0b' :
                report.status === 'Terminé' ? '#10b981' : '#64748b'

        let iconClass = 'bi-info-circle-fill'
        if (report.status === 'Nouveau') iconClass = 'bi-exclamation-triangle-fill'
        if (report.status === 'En cours') iconClass = 'bi-gear-fill'
        if (report.status === 'Terminé') iconClass = 'bi-check-circle-fill'

        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-circle" style="background:${color}">
                     <i class="bi ${iconClass}"></i>
                   </div>`,
            iconSize: [44, 44],
            iconAnchor: [22, 44],
        })

        L.marker([report.lat, report.lng], { icon })
            .addTo(map)
            .on('click', async () => {
                const address = await reverseGeocode(report.lat, report.lng)
                selectedMarker.value = { ...report, address }
            })
    })
}

const reverseGeocode = async (lat, lng) => {
    try {
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=fr`;

        const res = await fetch(url);
        const data = await res.json();

        return {
            name: data.locality || data.city || 'Lieu inconnu',
            road: data.principalSubdivision || 'Route inconnue',
            suburb: data.localityInfo?.administrative?.[2]?.name || 'Quartier inconnu'
        };

    } catch (e) {
        console.error('Erreur géocodage:', e);
        return {
            name: 'Lieu inconnu',
            road: 'Route inconnue',
            suburb: 'Quartier inconnu'
        };
    }
};

onMounted(async () => {

    const authCheck = await checkAuth()
    if (!authCheck) {
        router.push('/login')
        return
    }
    const user = getCurrentUser()
    const userEmail = user?.email

    console.log('Utilisateur connecté:', userEmail)
    const data = await listSignalements()

    reports.value = data.map(r => ({
        id: r.id,
        lat: r.geom?.latitude,
        lng: r.geom?.longitude,
        date: r.dateCreation?.seconds ? new Date(r.dateCreation.seconds * 1000) : new Date(),
        status: r.statutActuel?.nom || "Inconnu",
        surface: r.surface || 0,
        budget: r.budget || 0,
        company: r.entreprise?.nom || "Non assignée",
        photos: (r.photos || []).map(p => {
            if (!p) return null

            // Si la photo contient déjà le préfixe base64, on la garde telle quelle
            if (p.startsWith('data:image')) return p

            // Sinon on ajoute le préfixe
            return `data:image/jpeg;base64,${p}`
        }).filter(Boolean),
        isMine: r.utilisateur?.email === userEmail
    }))

    initMap()
})

const initMap = () => {
    setTimeout(() => {
        map = L.map('map').setView([-18.8792, 47.5074], 11)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        updateMapMarkers()

        setTimeout(() => map.invalidateSize(), 300)
    }, 200)
}

</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');

ion-content {
    --background: #0f172a;
    font-family: 'Inter', sans-serif;
}

/* Header */
.toolbar-custom {
    --background: rgba(15, 23, 42, 0.85);
    --backdrop-filter: blur(12px);
    --border-width: 0;
    --color: #e2e8f0;
}

.logo-title-container {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: 16px;
}

.header-logo {
    font-size: 28px;
    color: #3b82f6;
    filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
}

.toolbar-title {
    font-weight: 700;
    font-size: 20px;
    letter-spacing: -0.5px;
    color: #e2e8f0;
    width: fit-content;
}

.header-btn {
    --color: #94a3b8;
    --color-focused: #60a5fa;
}

/* Summary Card */
/* Summary Card - version responsive */
.summary-card {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    padding: 16px;
    margin: 16px;
    background: rgba(30, 41, 59, 0.92);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.summary-item {
    text-align: center;
    min-width: 0;
    /* Important pour éviter le débordement */
}

.summary-label {
    font-size: clamp(10px, 2.5vw, 12px);
    color: #94a3b8;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.summary-value {
    font-size: clamp(16px, 5vw, 20px);
    font-weight: 600;
    color: #60a5fa;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Pour les très petits écrans */
@media (max-width: 320px) {
    .summary-card {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        padding: 12px;
        margin: 12px;
    }
}

/* Pour les écrans moyens */
@media (min-width: 768px) {
    .summary-card {
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        padding: 20px;
        margin: 20px;
    }

    .summary-label {
        font-size: 14px;
    }

    .summary-value {
        font-size: 22px;
    }
}

/* Filter */
.filter-bar {
    padding: 0 16px 12px;
}

.filter-chip {
    --background: rgba(59, 130, 246, 0.2);
    --color: #60a5fa;
    font-weight: 600;
}

/* Map */
.map-container {
    height: calc(100vh - 220px);
    width: 100%;
}

/* Marqueurs ronds Bootstrap Icons */
.custom-marker {
    background: transparent;
    border: none;
}

.marker-circle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: currentColor;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    border: 3px solid white;
    position: relative;
    transition: transform 0.2s ease;
}

.marker-circle:hover {
    transform: scale(1.1);
}

.marker-circle i {
    color: white;
    font-size: 20px;
}

/* Effet de halo pulsant */
.marker-circle::after {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
    border-radius: 50%;
    background: inherit;
    opacity: 0.3;
    z-index: -1;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 0.3;
    }

    70% {
        transform: scale(1.4);
        opacity: 0;
    }

    100% {
        transform: scale(1.4);
        opacity: 0;
    }
}

/* Modal */
.gmaps-sheet {
    --border-radius: 20px 20px 0 0;
    --background: #0f172a;
    --box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
}

.gmaps-sheet::part(handle) {
    background: #64748b;
    width: 42px;
    height: 5px;
    border-radius: 4px;
    margin: 10px auto 6px;
}

/* Header du modal */
.modal-header ion-toolbar {
    --background: #1e293b;
    --border-style: none;
    --color: #cbd5e1;
    --padding-top: 4px;
    --padding-bottom: 4px;
}

.modal-content {
    --background: transparent;
    --padding-top: 0;
}

/* En-tête statut + date */
.detail-header {
    padding: 20px 20px 16px;
    text-align: center;
    background: linear-gradient(to bottom, #1e293b, #0f172a);
}

.status-badge.large {
    font-size: 16px;
    padding: 8px 20px;
    border-radius: 999px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.detail-date {
    margin-top: 12px;
    color: #94a3b8;
    font-size: 14px;
}

/* Grille d'informations */
.detail-info-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 16px 20px;
}

.info-item {
    background: rgba(30, 41, 59, 0.7);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    border: 1px solid rgba(148, 163, 184, 0.18);
}

.info-item.full {
    flex-direction: row;
}

.info-text {
    flex: 1;
}

.info-label {
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 4px;
}

.info-value {
    font-size: 16px;
    font-weight: 600;
    color: #e2e8f0;
}

/* Photos */
.photos-section {
    padding: 0 16px 32px;
}

.photos-section h3 {
    font-size: 17px;
    font-weight: 600;
    color: #e2e8f0;
    margin: 20px 0 12px;
}

.photos-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.photo-item img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
    border: 1px solid #2d3748;
    transition: transform 0.15s ease;
}

.photo-item img:hover {
    transform: scale(1.02);
}
</style>