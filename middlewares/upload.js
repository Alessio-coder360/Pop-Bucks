import multer from "multer";
import { CloudinaryStorage } from 'multer-storage-cloudinary'; 
import {v2 as cloudinary }from 'cloudinary'; 
import path from 'node:path'; 



const storageCloudinary = new CloudinaryStorage({
    cloudinary: cloudinary , 
    params:{
        folder: (req, file) => {
            if (file.fieldname === 'cover') return 'posts/covers';
            if (file.fieldname === 'profile') return 'users/profiles';
            if (file.fieldname === 'item') return 'items';
            if (file.fieldname === 'banner') return 'users/store-banners'; 
            if (file.fieldname === 'story') return 'stories';
            if (file.fieldname === 'video') return 'posts/videos';

            
                return 'general';
          },
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'mov', 'avi', 'wmv'],        // se non vuoi la sovrascrittura usi : 
          resource_type: 'auto', // ← AGGIUNGI QUESTA RIGA
          public_id: (req, file) => {
            // Solo timestamp + nome "pulito" senza spazi o caratteri strani
            const name = path.parse(file.originalname).name
              .replace(/[^\w\-]/g, '_')   // sostituisce tutto ciò che non è lettera, numero, _ o - con _
              .toLowerCase();
            return `${Date.now()}-${name}`;
          },

         // Aggiungi trasformazioni specifiche per i video
         transformation: [

  (req, file) => {
    console.log("DEBUG - Tipo file:", file.mimetype, "Dimensione:", file.size);
    
    // Ripristina le trasformazioni corrette
    if (file.fieldname === 'story' && file.mimetype.startsWith('video/')) {
      return [
        { width: 720, crop: 'limit', format: 'mp4', quality: 'auto', duration: 60 }
      ];
    }
    
    if (file.fieldname === 'cover') {
      return [{ width: 1200, crop: 'limit', format: 'auto' }];
    }
    return [{ width: 'auto', crop: 'scale', fetch_format: 'auto' }];

  }
],

resource_type: (req, file) => {
  if (file.fieldname === 'video' || file.mimetype.startsWith('video/')) {
    console.log("🎬 Rilevato file VIDEO:", file.fieldname, file.mimetype);
    return 'video';
  }
  

},

          // (req, file) => {
          //   console.log("DEBUG - Tipo file:", file.mimetype, "Dimensione:", file.size);
            
          //   // TEMPORANEAMENTE DISATTIVA TRASFORMAZIONI SPECIFICHE PER VIDEO
          //   return [{ width: 'auto', crop: 'scale', fetch_format: 'auto' }];

            // (req, file) => {
            //   console.log("File ricevuto:", req?.file?.originalname, "Fieldname:", file.fieldname);
            //   if (file.fieldname === 'story' && isVideoFile(file)) {
            //     return [
            //       {       width: 720, 
            //         crop: 'limit', 
            //         format: 'mp4',
            //         quality: 'auto',
            //         duration: 15 }
            //     ];
            //   }

            //   if (file.fieldname === 'cover') {
            //     return [{ width: 1200, crop: 'limit', format: 'auto' }];
            //   }
            //   return [{ width: 'auto', crop: 'scale', fetch_format: 'auto' }];
            
          
resource_options: {
    type: 'upload', // o auto, forse meglio prima vedo come funziona, con auto 
    // se hai risorse di tipo molto diverso (immagini, video, documenti PDF, ecc.) e vuoi che Cloudinary le gestisca tutte senza configurazione specifica
    // ma io uso prevalentemente video e immagini quindi basterà upload
    format: 'auto', 
    quality: 'auto' ,
    chunk_size: 20000000
},




    }
}
)

// funzione helper
function isVideoFile(file) {
    const videoMimetypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
    console.log("Tipo file:", file.mimetype, "È video?", videoMimetypes.includes(file.mimetype));
    return videoMimetypes.includes(file.mimetype);
  }

export const uploadmulterCloudinary = multer({storage: storageCloudinary }) // questa funzione ha bisogno come parametro di un oggetto di configurazione ( nel nostro esempio la const storage),


// !!approfondisci  in popultate della get id del post nel controller : 
// Il secondo populate usa la sintassi oggetto con path perché:

// Hai bisogno di un popolamento nidificato (populate dentro populate)
// Vuoi aggiungere opzioni di ordinamento
// Devi specificare quali campi selezionare per gli autori dei commenti









// const storageCloudinary = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//       folder: (req, file) => {
//           // ...folder logic remains the same...
//       },
//       allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'mov', 'avi', 'wmv'],
//       resource_type: 'auto',
//       public_id: (req, file) => {
//           return `${Date.now()}-${path.parse(file.originalname).name}`;
//       },
      
//       // Sostituisci l'intera sezione transformation con questo:
//       eager: (req, file) => {
//           // Per video nelle storie, applica trasformazioni eager
//           if (file.fieldname === 'story' && file.mimetype.startsWith('video/')) {
//               return [
//                   { width: 720, crop: 'limit', format: 'mp4', quality: 'auto', duration: 60 }
//               ];
//           }
          
//           // Per altri tipi di file, lascia vuoto (usa trasformazioni on-demand)
//           return [];
//       },
//       eager_async: false, // Attendi che la trasformazione sia completata
      
//       resource_options: {
//           type: 'upload',
//           format: 'auto',
//           quality: 'auto'
//       }
//   }
// });

