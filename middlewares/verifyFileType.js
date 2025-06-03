// Installa prima: npm install file-type
import * as FileType from 'file-type';

// Middleware di verifica file
export const validateFileMiddleware = async (req, res, next) => {
  // Salta la validazione se non c'è un file
  if (!req.file) {
    return next();
  }
  
  try {
    // Con Cloudinary storage, non abbiamo accesso al buffer
    // Dobbiamo validare in base alle proprietà disponibili
    const { mimetype, size, originalname } = req.file;
    
    // Definisci i tipi permessi
    const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedTypes = [...imageTypes, ...videoTypes];
    
    // Verifica se il tipo MIME è permesso
    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({ 
        message: `Formato non supportato: ${mimetype}. Formati consentiti: ${allowedTypes.join(', ')}` 
      });
    }
    
    // Verifica dimensione file per i video
    if (videoTypes.includes(mimetype)) {
      const MAX_SIZE = 50 * 1024 * 1024; // 50MB
      if (size > MAX_SIZE) {
        return res.status(400).json({ 
          message: `Video troppo grande (${Math.round(size/1024/1024)}MB). Limite: 50MB` 
        });
      }
    }
    
    // Validazione passata
    next();
  } catch (error) {
    console.error("Errore nella validazione file:", error);
    res.status(500).json({ message: "Errore nella verifica del file" });
  }
};

