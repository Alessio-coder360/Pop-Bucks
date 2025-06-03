import  Story  from '../models/story.js';
import User from '../models/user.js';
import cloudinary from '../config/cloudinary.js';
import logger from '../middlewares/ErrorLoggerWinston.js';




export const getStories = async (request,response) => {
try{
    const userId = request.user.id
        
    // Recupera gli utenti che l'utente corrente segue + l'utente stesso

    const user =  await User.findById(userId).select("following"); // Trova l'utente e seleziona solo il campo "following"
    const relevantUsers = [ ...user.following, userId]

        // Recupera solo storie non scadute dagli utenti rilevanti
        const stories = await Story.find({
            author: { $in: relevantUsers},
            expiresAt: { $gt: Date.now() } // Storie non scadute
        })
        .sort({ createdAt: -1 }) // Ordina per data di creazione (più recenti prima)
        .populate("author", "firstName lastName profilePicture") // Popola i dettagli dell'autore
        .populate("linkedItem", "name price images status") // Popola i dettagli dell'articolo collegato ref: item in story. 
        .lean(); // Restituisce un oggetto JavaScript semplice invece di un documento Mongoose

    // Raggruppa le storie per utente per l'UI stile Instagram
    const storiesByUser = stories.reduce((acc, story) =>{
    const authorId = story.author._id.toString(); // Converti l'ID in stringa per evitare problemi di confronto
    if(!acc[authorId]){
        acc[authorId]= {
            user: story.author,
            stories:[]
        }
    }
    acc[authorId].stories.push(story) // array stories
    return acc; // per le successive interazioni e quindi per aggiungere altre successive storie 
        // vedi parametro acc in reduce 

    }, {}); // Inizializza l'accumulatore come oggetto vuoto

 
        // restituisci le storie raggruppate:
        response.status(200).json({ stories: Object.values(storiesByUser)
            //Object.values() estrae solo i valori, trasformandolo in un array, 
            // utile al front end per un ciclo map 
            // [
            //     { user: {...}, stories: [...] },
            //     { user: {...}, stories: [...] }
            //   ]

            // senza : 
            // {{
                // "123": { user: {...}, stories: [...] },
                // "456": { user: {...}, stories: [...] }


        });


}
catch(error){
    console.error("Errore nel recupero delle storie:", error);
    response.status(500).json({ message: "Errore nel recupero delle storie" });
}

}



// TODO RECUPERA UNA STORIA PER ID:

export const getStoryById = async (request, response) => {
  try {
    const { id } = request.params;
    
    const story = await Story.findById(id)
      .populate('author', 'firstName lastName username profilePicture')
      .populate('linkedItem', 'name price images status')
      .lean();
    
    if (!story) {
      return response.status(404).json({ message: 'Storia non trovata' });
    }
    
    // Verifica se la storia è scaduta
    if (new Date(story.expiresAt) < new Date()) {
      return response.status(410).json({ message: 'Storia scaduta' });
    }
    
    response.status(200).json(story);
  } catch (error) {
    console.error('Errore nel recupero della storia:', error);
    response.status(500).json({ message: 'Errore nel server', error: error.message });
  }
};




// TODO CREA UN NUOVA STORIA 


export const createStory = async (request, response) => {
    try {
    
      
      const { linkedItem, linkedPost } = request.body;// è OPZIONALe, sperché nello Schema:
      // non c'è required: true 
  
  
      // non serve recuperare id dalla request come = > const{id}=  request.params, PERCHé L'ID ANCORA NON ESISTE,
      // verrà creato dopo la ceazione, 
      const author = request.user.id;
      
      if (!request.file) {
        return response.status(400).json({ message: 'Media richiesto per la storia' });
      }
      
      // Determina il tipo di media in base all'estensione
   
      const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv'];
  
      // Converte il nome file in minuscolo per fare confronti case-insensitive
      const fileName = request.file.originalname.toLowerCase(); 
  
      // Verifica se il nome file termina con una delle estensioni video
      const isVideo = videoExtensions.some(ext => fileName.endsWith(ext));
      
      const newStory = new Story({
        author,
        media: {
          type: isVideo ? 'video' : 'image',
          url: request.file.path
        },
        linkedItem,
        linkedPost
        // expiresAt viene impostato automaticamente dal default function nello schema
      });
      
      await newStory.save();
      
      const populatedStory = await Story.findById(newStory._id)
        .populate('author', 'firstName lastName username profilePicture')
        .populate('linkedItem', 'name price images status')
        .lean();
      
      response.status(201).json({
        message: 'Storia creata con successo',
        story: populatedStory
      });
    } 
      catch (error) {
        logger.error('Errore creazione storia', {
          userId: request.user.id,
          error: error.message,
          stack: error.stack,
          fileInfo: request.file ? {
            name: request.file.originalname,
            type: request.file.mimetype,
            size: request.file.size
          } : 'No file'
        })
        response.status(500).json({ message: 'Errore nel server', error: error.message });
      }
    }

  

  
  // TODO AGGIORNA UNA STORIA:

  export const updateStory = async (request, response) => {


    try {
        const{id}=request.params;
        
        const {linkedItem} = request.body; // linkedItem Opzionale, non è richiesto nello schema
        
        const story = request.story // assegna una costante alla request passata dal middleware isStoryAhutors
        if(!story) {
            return response.status(404).json({message: "Storia non trovata"});}
        
    if (!request.file) {
        return response.status(400).json({ message: "Nessuna Storia caricata" });
      }

      // Se c'è una storia precedente, elimina il file da Cloudinary
 // In updateStory
if (existingStory && existingStory.media && existingStory.media.url) {
    try {
      const publicId = getPublicIdFromUrl(existingStory.media.url);
      await cloudinary.uploader.destroy(publicId, { 
        resource_type: existingStory.media.type === 'video' ? 'video' : 'image'
      });  
    } catch (cloudinaryError) {
      console.error('Errore durante l\'eliminazione del file precedente:', cloudinaryError);
    }
  }

        const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv'];
        const fileName = request.file.originalname.toLowerCase();
        const isVideo = videoExtensions.some(ext => fileName.endsWith(ext));
        
        // Prepara l'oggetto di aggiornamento
        const updateData = {};
        
        if (linkedItem) {
          updateData.linkedItem = linkedItem;
        }
        
        updateData.media = {
          type: isVideo ? 'video' : 'image',
          url: request.file.path
        };
        
        // Verifica se ci sono dati da aggiornare
        if (Object.keys(updateData).length === 0) {
          return response.status(400).json({ message: "Nessuna modifica da applicare" });
        }

            const updatedStory = await Story.findByIdAndUpdate(
                id,
            {linkedItem,
                media:{
                type: isVideo ? 'video' : 'image',
                url: request.file.path}
            
                },
             {new: true,
                runValidators: true,
             } // Esegui la validazione dello schema
                // per assicurarti che i dati aggiornati siano validi)
            )
            .populate("author", "firstName lastName profilePicture")
            .populate('linkedItem', 'name price images status')
            .lean()
            
            response.status(200).json({
                message: "Storia aggiornata con successo",
                story: updatedStory // devi usare chiavi non puoi mettere solo updateStory
            })
        }
        
        catch(error){
        console.error("Errore nell'aggiornamento della storia")
        response.status(500).json({message: "Errore nel server, Errore nell'aggiornamento della storia", error: error.message,
        
        });

    }
}







// TODO CANCELLA UNA STORIA PER ID:



export const deleteStory = async (request, response) => {
    try {
      const { id } = request.params;
      const author = request.user.id;
      
      const story = await Story.findById(id);
      
      if (!story) {
        return response.status(404).json({ message: 'Storia non trovata' });
      }
      
         // Verifica che l'utente sia l'autore
    if (story.author.toString() !== author) { //story.author. author è un attributo presente nello schema Story
        return response.status(403).json({ message: 'Non sei autorizzato a eliminare questa storia' });
      }
      
      // Verifica autorizzazione come prima...
      
      // 1. Estrai l'ID pubblico di Cloudinary dall'URL
      const publicId = getPublicIdFromUrl(story.media.url);
      
      // 2. Elimina il file da Cloudinary
      await cloudinary.uploader.destroy(publicId, { 
        resource_type: story.media.type === 'video' ? 'video' : 'image'
      });
      
      // 3. Elimina la storia dal database
      await Story.findByIdAndDelete(id);
      
      response.status(200).json({ message: 'Storia eliminata con successo' });
     } catch (error) {
        console.error('Errore nell\'eliminazione della storia:', error);
        response.status(500).json({ 
          message: 'Errore durante l\'eliminazione della storia', 
          error: error.message 
        });
      } }
  
  // Funzione helper per estrarre il publicId dall'URL Cloudinary
 export  function getPublicIdFromUrl(url) {
    // Un tipico URL Cloudinary è: https://res.cloudinary.com/tuo-cloud-name/image/upload/v1234567890/stories/abcdef123456
    // Vogliamo estrarre "stories/abcdef123456"
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const folderName = urlParts[urlParts.length - 2];
    return `${folderName}/${fileName.split('.')[0]}`; // Rimuovi l'estensione se presente
  }







// TODO VISUALIZZAZIONE STORIA: 

export const viewStory = async (request, response) => {
  try {
    const { id } = request.params;
    const userId = request.user.id;
    
    // Trova la storia e verifica che esista
    const story = await Story.findById(id);
    
    if (!story) {
      return response.status(404).json({ message: 'Storia non trovata' });
    }
    
    // Verifica se la storia è scaduta
    if (new Date(story.expiresAt) < new Date()) {
      return response.status(410).json({ message: 'Storia scaduta' });
    }
    
    // Verifica se l'utente ha già visto questa storia
    const alreadyViewed = story.viewers.some(view => 
      view.user.toString() === userId
    );
    
    // Prepara l'oggetto di aggiornamento
    const updateData = {};
    
    // Se non è già stata vista, aggiungi l'utente ai visualizzatori
    if (!alreadyViewed) {
      updateData.$push = { 
        viewers: { user: userId, viewedAt: new Date() } 
      };
    }
    
    // Verifica se ci sono dati da aggiornare
    if (Object.keys(updateData).length === 0) {
      return response.status(400).json({ message: "Nessuna modifica da applicare" });
    }
    
    await Story.findByIdAndUpdate(id, updateData);
    
    response.status(200).json({ message: 'Visualizzazione registrata' });
  } catch (error) {
    console.error('Errore nella registrazione della visualizzazione:', error);
    response.status(500).json({ message: 'Errore nel server', error: error.message });
  }
};