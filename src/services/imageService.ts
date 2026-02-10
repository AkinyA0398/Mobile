export async function resizeAndCompressImage(file: File, maxDim: number = 800, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Calcul du scale
        const scale = Math.min(maxDim / width, maxDim / height, 1); // ne pas agrandir
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Impossible de récupérer le context canvas");

        ctx.drawImage(img, 0, 0, width, height);

        // Export en JPEG compressé
        const dataUrl = canvas.toDataURL("image/jpeg", quality); // qualité 0.0 à 1.0
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Convertir une liste de fichiers File[] en Base64 compressé et redimensionné
 */
export async function filesToBase64(files: File[], maxDim: number = 800, quality: number = 0.8): Promise<string[]> {
  const results: string[] = [];
  for (const file of files) {
    const base64 = await resizeAndCompressImage(file, maxDim, quality);
    results.push(base64);
  }
  return results;
}
