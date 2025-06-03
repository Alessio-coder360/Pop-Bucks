import jwt from 'jsonwebtoken'; // Importiamo la libreria per gestire i token JWT
import User from '../models/user.js'; // Importiamo il modello User per verificare l'esistenza dell'utente
import Post from '../models/post.js'; // Importiamo il modello Post per verificare l'autore del post
import Item from '../models/item.js'; // Importiamo il modello Item per verificare l'autore dell'item
import Story from '../models/story.js'; // Importiamo il modello Story per verificare l'autore della storia


/**
 * Middleware di autenticazione
 * Verifica che la richiesta contenga un token JWT valido e lo decodifica
 * Se valido, aggiunge le informazioni dell'utente alla richiesta e passa al controller
 */

// ! authMiddleware: Solo verifica, non genera

export const authMiddleware = async (request, response, next) => {
  try {
    // Estraiamo il token dall'header Authorization

    // Il formato standard è "Bearer [token]", quindi splittiamo e prendiamo la seconda parte
    const token = request.headers.authorization?.split(' ')[1]; // quella dopo il Bearer, salviamo il token 
    
    // Se il token non esiste, l'utente non è autenticato
    if (!token) {
      return response.status(401).json({ message: 'Accesso negato: token mancante' });
    }
    
    // Verifichiamo e decodifichiamo il token usando la chiave segreta
    // Se il token non è valido o è scaduto, jwt.verify lancerà un'eccezione
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ! ricordati di mettere la chiave segreta nel file .env
    
    // Estraiamo l'ID dell'utente dal token decodificato
    const userId = decoded.id;
    
    // Verifichiamo che l'utente esista ancora nel database
    // Questo è importante in caso l'account sia stato eliminato dopo il rilascio del token
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return response.status(404).json({ message: 'Utente non trovato' });
    }
    
    // Aggiungiamo le informazioni dell'utente all'oggetto richiesta
    // Questo rende l'utente disponibile a tutti i controller che vengono dopo
    request.user = user;
    
    // Continuiamo con il prossimo middleware o controller nella catena
    next();
    
  } catch (error) {
    // Gestiamo gli errori specifici di JWT
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ message: 'Token non valido' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return response.status(401).json({ message: 'Token scaduto' });
    }
    
    // Per altri tipi di errori, restituiamo un errore generico
    console.error('Errore di autenticazione:', error);
    response.status(500).json({ message: "Errore del server durante l'autenticazione" });
  }
};








// ! GitHub Copilot
// ! Comprensione del Sistema di Autenticazione e Autorizzazione
// ! Sì, è così per la maggior parte dei progetti di autenticazione moderni
// ! Il tuo ragionamento è quasi completamente corretto. Ecco come funziona questo pattern standard:
 
// ! Come Funziona l'Autenticazione e l'Autorizzazione
// ! Middleware di autenticazione (authMiddleware):
 
// ! Verifica il token JWT
// ! Se il token è valido, cerca l'utente nel database
// ! Se l'utente esiste, aggiunge l'oggetto utente a request.user
// ! Chiama next() per continuare alla prossima funzione
// ! Middleware di autorizzazione (come isPostAuthor):
 
// ! Usa request.user aggiunto dal middleware di autenticazione
// ! Verifica permessi specifici (es. se l'utente è l'autore di un post)
// ! Se autorizzato, chiama next()
// ! Se non autorizzato, risponde con errore 403
// ! Controller:
 
// ! Riceve la richiesta con request.user già popolato
// ! Usa request.user.id quando deve associare nuovi documenti all'utente
// ! Le tue affermazioni
// ! "cioè il middleware qui effettivamente verifica solo autenticazione del token su un piano pratico prima nel next"
 
// ! VERO. authMiddleware verifica solo che l'utente sia autenticato (token valido).
 
// ! "poi ha un if che gestisce se è user o no"
 
// ! VERO. Il middleware controlla se l'utente esiste ancora nel database.
 
// ! "quel if non soddisfatto genera una request.user = user, che serve per le autorizzazioni stavolta"
 
// ! PARZIALMENTE CORRETTO. L'assegnazione request.user = user avviene solo se l'utente è trovato (l'if è soddisfatto, non il contrario). Questa assegnazione rende disponibile l'utente per:
 
// ! Autorizzazione in middleware successivi
// ! Associazione di nuovi documenti all'utente nei controller
// ! "e ne ho bisogno ogni volta che creo gli devo assegnare un id (user) alla mia creazione che sia un post o un commento"
 
// ! ASSOLUTAMENTE VERO. Ogni volta che crei un nuovo documento che richiede un riferimento all'utente (post, commento, like, ecc.), devi estrarre request.user.id per assegnare l'autore o proprietario.



// middleware solo per eseguire operazioni sul post 


export const isPostAuthor = async ( request, response, next)=>
{
  try{
    const id = request.params.id;
    const userId = request.user.id;

    const post = await Post.findById(id);

    if(!post){
      return response.status(404).json({message: "Post non trovato"});
    }

    // verifica se l'utente è autorizzato perché è il suo post ( vedi userId) e sblocca ed esegue la riga 80 SE è FALSE
    if( post.author.toString() !== userId){ 
      return response.status(403).json({message: "Non sei autorizzato a modificare questo post"});
    }


request.post = post; // ←-- Salva il post nella richiesta( VERRà USATO nell'ultimo middleware per l'update)
// i dati aggiunti alla richiesta in qualsiasi middleware sono disponibili ai middleware successivi, 
// indipendentemente dai nomi dei parametri utilizzati.
next();  
}
catch(error){
response.status(500).json({message: "Errore del server durante l'autenticazione"});
console.error('Errore di autenticazione:', error);
}}



// MIDDLEWARE controllo ItemImg esistente:


export const isItemAuthor = async ( request, response, next)=>
  {
    try{
      const id = request.params.id;
      const userId = request.user.id;
  
      const item = await Item.findById(id);
  
      if(!item){
        return response.status(404).json({message: "item non trovato"});
      }
  
      // verifica se l'utente è autorizzato perché è il suo post ( vedi userId) e sblocca ed esegue la riga 80 SE è FALSE
      if( item.seller.toString() !== userId){ // confrontiamo id di seller con quello dello user, perché devono essere lo stesso utente, e item nello schema a seller con ref: user 
        return response.status(403).json({message: "Non sei autorizzato a modificare questo item"});
      }
  
  
  request.item = item; 
  next();  
  }
  catch(error){
  response.status(500).json({message: "Errore del server durante l'autenticazione"});
  console.error('Errore di autenticazione:', error);
  }}


  // MIDDLEWARE PER CONTROLLO OPERAZIONI STORIA 
  

  export const isStoryAuthor = async ( request, response, next)=>
    {
      try{
        const id = request.params.id; // serve a findBYid sotto, per sapere quale è l'elemento da modificare 
        const userId = request.user.id;
    
        const story = await Story.findById(id);
    
        if(!story){
          return response.status(404).json({message: "Storia non trovata"});
        }
    
        // verifica se l'utente è autorizzato perché è il suo post ( vedi userId) e sblocca ed esegue la riga 80 SE è FALSE
        if( story.author.toString() !== userId){ // confrontiamo id di seller con quello dello user, perché devono essere lo stesso utente, e item nello schema a seller con ref: user 
          return response.status(403).json({message: "Non sei autorizzato a modificare questa Storia"});
        }
    
    
    request.story = story; 
    next();  
    }
    catch(error){
    response.status(500).json({message: "Errore del server durante l'autenticazione"});
    console.error('Errore di autenticazione:', error);
    }}