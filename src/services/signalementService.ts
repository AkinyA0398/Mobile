import { collection, getDocs, query, where, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { getCurrentUser } from "./authService"; // ton service auth
import { v4 as uuidv4 } from "uuid";

const COLLECTION = "signalements";

export interface Signalement {
  id: string;
  [key: string]: any;
}

export const listSignalements = async (idUtilisateur?: string): Promise<Signalement[]> => {
  try {
    let q;

    if (idUtilisateur && idUtilisateur.trim() !== "") {
      q = query(
        collection(db, COLLECTION),
        where("utilisateur.id", "==", idUtilisateur)
      );
    } else {
      q = query(collection(db, COLLECTION));
    }

    const querySnapshot = await getDocs(q);

    const results: Signalement[] = [];
    querySnapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return results;
  } catch (error) {
    console.error("Erreur récupération signalements:", error);
    return [];
  }
};

interface SignalementPayload {
  description: string;
  surface: number;
  budget?: number;
  latitude: number;
  longitude: number;
  entrepriseId: number;
  typeSignalement: { id: number; nom: string };
}

export async function creerSignalement(payload: SignalementPayload, photos: string[] = []) {
  try {
    const user = getCurrentUser();
    if (!user?.email) throw new Error("Utilisateur non connecté");

    // Récupérer l'utilisateur Firestore
    const userQuery = query(collection(db, "users"), where("email", "==", user.email),);
    const userSnap = await getDocs(userQuery);
    if (userSnap.empty) throw new Error(`Utilisateur introuvable avec email: ${user.email}`);
    const utilisateurFirestore = userSnap.docs[0].data();

    // Récupérer l'entreprise
    const entrepriseQuery = query(collection(db, "entreprises"), where("id", "==", payload.entrepriseId));
    const entrepriseSnap = await getDocs(entrepriseQuery);
    if (entrepriseSnap.empty) throw new Error(`Entreprise introuvable avec ID: ${payload.entrepriseId}`);
    const entrepriseFirestore = entrepriseSnap.docs[0].data();

    // Générer ID du signalement
    const signalementId = uuidv4();

    // Préparer les données
    const data: any = {
      description: payload.description,
      surface: payload.surface,
      budget: payload.budget ?? null,
      dateCreation: new Date(),
      geom: {
        latitude: payload.latitude,
        longitude: payload.longitude
      },
      utilisateur: utilisateurFirestore,
      entreprise: entrepriseFirestore,
      typeSignalement: payload.typeSignalement,
      statutActuel: {
        id: 2,
        nom: "Nouveau",
        ordre: 1,
        avancement: 0,
        dateStatut: new Date()
      },
      photos: photos.map(p => p), // Base64 déjà fourni
      sync: false
    };

    await setDoc(doc(db, "signalements", signalementId), data);

    return signalementId;
  } catch (err: any) {
    console.error("Erreur création signalement:", err);
    throw err;
  }
}
