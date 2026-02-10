import { collection, getDocs, query, where, doc, setDoc, getDoc } from "firebase/firestore";
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
    querySnapshot.forEach((doc: any) => {
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

// Ajoutez ces interfaces
export interface TypeSignalement {
  id: string;
  nom: string;
  description: string;
  icone: string;
  couleur: string;
}

export interface Entreprise {
  id: string;
  nom: string;
  [key: string]: any;
}

// Ajoutez ces fonctions à votre fichier signalementService.ts
export const getAllTypes = async (): Promise<TypeSignalement[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "types_signalement"));
    const types: TypeSignalement[] = [];
    
    querySnapshot.forEach((doc: any) => {
      types.push({
        id: doc.id,
        ...doc.data(),
      } as TypeSignalement);
    });
    
    return types;
  } catch (error) {
    console.error("Erreur récupération types signalement:", error);
    return [];
  }
};


interface SignalementPayload {
  description: string;
  surface: number;
  latitude: number;
  longitude: number;
  entrepriseId: number;
  typeSignalementId: number;
}

export const getAllEntreprises = async (): Promise<Entreprise[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "entreprises"));
    const entreprises: Entreprise[] = [];
    
    querySnapshot.forEach((doc : any) => {
      entreprises.push({
        id: doc.id,
        ...doc.data(),
      } as Entreprise);
    });
    
    return entreprises;
  } catch (error) {
    console.error("Erreur récupération entreprises:", error);
    return [];
  }
};

// Modifiez la fonction creerSignalement pour utiliser correctement les IDs
export async function creerSignalement(payload: SignalementPayload, photos: string[] = []) {
  try {
    const user = getCurrentUser();
    if (!user?.email) throw new Error("Utilisateur non connecté");

    // Récupérer l'utilisateur Firestore
    const userQuery = query(collection(db, "users"), where("email", "==", user.email));
    const userSnap = await getDocs(userQuery);
    if (userSnap.empty) throw new Error(`Utilisateur introuvable avec email: ${user.email}`);
    const utilisateurFirestore = userSnap.docs[0].data();

    // Récupérer l'entreprise
    const entrepriseRef = doc(db, "entreprises", payload.entrepriseId.toString());
    const entrepriseSnap = await getDoc(entrepriseRef);
    if (!entrepriseSnap.exists()) throw new Error(`Entreprise introuvable avec ID: ${payload.entrepriseId}`);
    const entrepriseFirestore = entrepriseSnap.data();

    // Récupérer le type de signalement
    const typeRef = doc(db, "types_signalement", payload.typeSignalementId.toString());
    const typeSnap = await getDoc(typeRef);
    if (!typeSnap.exists()) throw new Error(`Type de signalement introuvable avec ID: ${payload.typeSignalementId}`);
    const typeFirestore = typeSnap.data();

    // Générer ID du signalement
    const signalementId = uuidv4();

    // Préparer les données
    const data: any = {
      description: payload.description,
      surface: payload.surface,
      dateCreation: new Date(),
      geom: {
        latitude: payload.latitude,
        longitude: payload.longitude
      },
      utilisateur: utilisateurFirestore,
      entreprise: entrepriseFirestore,
      niveau: 0,
      typeSignalement: typeFirestore,
      statutActuel: {
        id: 2,
        nom: "Nouveau",
        ordre: 1,
        avancement: 0,
        dateStatut: new Date()
      },
      photos: photos.map(p => p),
      sync: false
    };

    await setDoc(doc(db, "signalements", signalementId), data);

    return signalementId;
  } catch (err: any) {
    console.error("Erreur création signalement:", err);
    throw err;
  }
}
