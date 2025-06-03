// IMPORTA QUESTE DIPENDENZE ALL'INIZIO DEL FILE
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

// CONFIGURA L'API KEY UNA SOLA VOLTA
dotenv.config();
console.log("SendGrid API Key trovata:", process.env.EMAIL_KEY?.substring(0, 10) + "...");
sgMail.setApiKey(process.env.EMAIL_KEY);

import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Item from "../models/item.js";
import Order from "../models/order.js";





//  Banner di default
const defaultBanners = {
    'Electronics': 'https://source.unsplash.com/1200x300/?electronics',
    'Clothing': 'https://source.unsplash.com/1200x300/?fashion',
    'Books': 'https://source.unsplash.com/1200x300/?books',
    'Food': 'https://source.unsplash.com/1200x300/?food',
    'Other': 'https://source.unsplash.com/1200x300/?store'
  };
  
  // Funzione di supporto
  function getDefaultBannerForCategory(category) {
    return defaultBanners[category] || defaultBanners['Other'];
  }


  
  export const setupUserStore = async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Trova la categoria principale dell'utente
      const items = await Item.find({ seller: userId }).lean();
      const categories = items.map(item => item.category);
      const mainCategory = findMostFrequent(categories) || 'Other';
      
      // Imposta banner di default basato sulla categoria
      await User.findByIdAndUpdate(userId, {
        storeBanner: getDefaultBannerForCategory(mainCategory)
      });
      
      res.status(200).json({ message: "Store setup completato" });
    } catch (error) {
      res.status(500).json({ message: "Errore nel server" });
    }
  };
  
  function findMostFrequent(arr) {
    const map = {};
    let mostFrequent;
    let maxCount = 0;
    
    for (const item of arr) {
      map[item] = (map[item] || 0) + 1;
      if (map[item] > maxCount) {
        mostFrequent = item;
        maxCount = map[item];
      }
    }
    
    return mostFrequent;
  }



// TODO --- GET ALL USERS


export const getUsers= async (request,response)=>{
    try{
       
        // Esempio: Escludi l'utente corrente dai risultati
        const userId = request.user.id;
        const users = await User.find({ _id: { $ne: userId } }).select("-password -__v").sort({createdAt: -1});

        // tolgo __v per : Avere JSON più pulitI, Nascondere dettagli interni del database, Ridurre la dimensione della risposta
        response.status(200).json(users)


    }catch(error){
        console.error("Errore nel recupero degli utenti:", error);
        response.status(500).json({message: "Errore nel server "})
    }
}    

// TODO CREA USER 


// ! userController.createUser: Genera il token alla registrazione
// ! Il token in createUser serve per autologgare l'utente dopo la registrazione.

export const createUser = async (request, response) => {
    try {
        // Debug intensivo - mostra tutti i dati ricevuti
        console.log("--------- DEBUG REGISTRAZIONE ---------");
        console.log("BODY:", request.body);
        console.log("HEADERS:", request.headers);
        console.log("FILE:", request.file);
        console.log("METHOD:", request.method);
        console.log("---------------------------------------");
        
        // NUOVO: Debug specifico per l'immagine
        console.log("DETTAGLI IMMAGINE:", {
            presente: !!request.file,
            path: request.file?.path,
            mimetype: request.file?.mimetype,
            filename: request.file?.filename,
            size: request.file?.size
        });
        
        // Controllo campi richiesti
        const fields = ['firstName', 'lastName', 'email', 'username', 'password'];
        const missingFields = fields.filter(field => !request.body[field]);
        
        if (missingFields.length > 0) {
            return response.status(400).json({
                message: `Campi mancanti: ${missingFields.join(', ')}`,
                missingFields
            });
        }

        const {
            firstName,
            lastName,
            email,
            password,
            username,
            bio = "", // campi opzionali con default
            location = null,
            profilePicture = null,
            storeBanner = null,
        } = request.body;

        // Verifica email/username duplicati
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        // Anche se lo schema ha unique IN EMAIL: true, questa è solo una regola per MongoDB che crea un indice univoco, ma:
        // 1)Non gestisce messaggi di errore user-friendly
        // 2)Lancia un errore generico di duplicazione che non distingue se è l'email o username // ! approfondisci
        // 3)Anticipare il controllo permette di fornire messaggi specifici all'utente
        
        if (existingUser) {
            // Gestione errore utente esistente...
            return response.status(400).json({
                message: existingUser.email === email 
                ? "Email già registrata" 
                : "Username già in uso"
            });
        }

        // crea struttura base utente
        const userData = {firstName, lastName, email, password, username, bio};
        
        // Aggiungi location solo se presente
        if (location) {
            userData.location = {
                type: "Point",
                coordinates: location.coordinates || [0,0], 
                // [0°,0°] (Golfo di Guinea, nell'oceano Atlantico) MongoDB richiede comunque un array di coordinate valide per un campo di tipo "Point"
                address: location.address || {} // default oggetto vuoto per evitare errori
            };
        }

        // CORREZIONE: Gestione corretta dell'immagine profilo
        if (request.file) {
            // Costruisci l'URL completo di Cloudinary usando il path restituito
            const cloudinaryUrl = request.file.path;
            userData.profilePicture = cloudinaryUrl;
            console.log("🔍 IMMAGINE SALVATA:", {
                cloudinaryUrl,
                fileInfo: request.file,
                headers: request.headers['content-type']
            });
        } 
        // Altrimenti usa il valore dal body se fornito
        else if (profilePicture) {
            userData.profilePicture = profilePicture;
        } else {
            // Default se non è stata fornita alcuna immagine - USA IL TUO VERO CLOUD NAME
            userData.profilePicture = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1613149781/users/profiles/default-profile.jpg`;
        }
        
        // Aggiungi storeBanner solo se presente
        if (storeBanner) userData.storeBanner = storeBanner;

        console.log("DATI UTENTE PRIMA DI SALVARE:", userData);
        const newUser = new User(userData);
        const savedUser = await newUser.save();
        console.log("UTENTE SALVATO:", savedUser);

        // Genera token per login automatico
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
                    
        // Non inviare la password al client
        // toObject(): Converte il documento Mongoose in un oggetto JavaScript puro
        // delete: Rimuove la password dall'oggetto prima di inviarlo al client
        // ! Perché? Sicurezza - non inviare mai la password (anche se hashata) al frontend
        
        const userWithoutPassword = newUser.toObject();
        delete userWithoutPassword.password;

        // Invia email di benvenuto con SendGrid
        const msg = {
          to: email,
          from: 'alessiocardone732@gmail.com', // Email verificata in SendGrid
          subject: 'Benvenuto su Pop-Bucks!',
          text: `Ciao ${firstName}, grazie per esserti registrato su Pop-Bucks!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4a4a4a;">Benvenuto su Pop-Bucks, ${firstName}!</h2>
              <p>Grazie per esserti registrato sulla nostra piattaforma.</p>
              <p>Con Pop-Bucks puoi:</p>
              <ul>
                <li>Vendere e acquistare articoli</li>
                <li>Condividere storie e post</li>
                <li>Connetterti con altri utenti</li>
              </ul>
              <div style="margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-radius: 5px;">
                <p style="margin: 0;">Il tuo username: <strong>${username}</strong></p>
              </div>
              <p>Inizia subito a esplorare la piattaforma!</p>
              <a href="https://popbucks.com/login" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px;">Accedi Ora</a>
            </div>
          `
        };

        try {
          await sgMail.send(msg);
          console.log(`Email di benvenuto inviata a ${email}`);
        } catch (emailError) {
          console.error('Errore nell\'invio dell\'email:', emailError);
          // Non permettere che un errore email blocchi la registrazione
        }

        // Prima di inviare la risposta
        console.log("✅ UTENTE INVIATO AL FRONTEND:", {
            profilePicture: userWithoutPassword.profilePicture,
            userObj: userWithoutPassword
        });

        response.status(201).json({
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error("Errore nel server:", error);
        
        // Gestione degli errori specifici
        if (error.name === 'ValidationError') {
            return response.status(400).json({ 
                message: 'Dati non validi', 
                errors: Object.values(error.errors).map(e => e.message)
            });
        }
        
        // Errore di duplicazione MongoDB
        if (error.code === 11000) {
            return response.status(400).json({ 
                message: 'Email o username già in uso'
            });
        }
        
        response.status(500).json({
            message: "Si è verificato un errore durante la registrazione",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
    

    

    // TODO --- PUT AGGIORNA USER 


    // PERCHè NON USO CONST {id} come nei post 
// Differenza tra Modificare Post e Utente - Spiegazione Approfondita
// La differenza principale è chi possiede la risorsa:

// Per i post:

// Un utente può creare molti post (one-to-many)
// Quando modifichi un post, devi specificare quale dei tanti post vuoi modificare
// L'ID del post è necessario per identificare esattamente quale documento modificare
// const { id } = request.params estrae l'ID del post dall'URL (es: /posts/123)

// Per l'utente/profilo:

// Ogni utente ha un solo profilo (one-to-one)
// Quando modifichi un profilo, stai sempre modificando il tuo profilo
// L'ID utente è già disponibile da request.user.id (inserito dal middleware di autenticazione)
// Non serve l'ID nei parametri perché è implicito che si tratti del tuo profilo
    
    export const updateUser= async (request,response)=>{
        try{
            const userId = request.user.id; // 

            const {currentPassword, newPassword, ...otherUpdates} = request.body 
            //Estrae currentPassword e newPassword come variabili separate
            //Mette TUTTO IL RESTO dei campi in un oggetto chiamato otherUpdates
            // unione di spread operator con destrutturazione, durante la destrutturazione posso nominare un nuovo
        //oggetto che conterrà gli altri elementi del form
         

            const updateData = {};
            if (otherUpdates.firstName) updateData.firstName = otherUpdates.firstName;
            if( otherUpdates.lastName) updateData.lastName = otherUpdates.lastName;
            if( otherUpdates.bio) updateData.bio = otherUpdates.bio;

            // INIZIO CONTROLLO 
            if(otherUpdates.username){

            //Verifica SE username duplicato
            const existingUser = await User.findOne({
                username: otherUpdates.username, // cerca un username uguale a questo
                _id: { $ne: userId } // Escludi con ne l'utente corrente non elimina
            })
            // significa letteralmente: "Trova un utente con questo username -> username: otherUpdates.username,
            //  MA con ID diverso dall'utente corrente" -> _id: { $ne: userId } 
            
        
            if(existingUser){ // se il nuovo già esiste 
                return response.status(400).json({
                    message: "Username già in uso" 
                })
            }  // Se esiste un altro utente con quello username, la modifica viene rifiutata

            updateData.username = otherUpdates.username 
        } // FINE CONTROLLO 

           
    // Campi annidati - usa dot notation

    // ! Questa è la "dot notation" di MongoDB:

    // ! location.coordinates è una stringa che MongoDB interpreta come "accedi alla proprietà coordinates dentro l'oggetto location"
    // ! Perché usarla? Per aggiornare campi nidificati senza sovrascrivere l'intero oggetto parent
    // ! Nota importante: È scritta tra parentesi quadre perché in JavaScript obj.a.b cercherebbe la proprietà a.b di obj, non la proprietà b di a

    // In MongoDB, quando hai oggetti annidati, USI DOT NOTATION, senza sovrascriverebbe tutti gli altri campi
         
        // Senza dot notation (sovrascrive l'intero oggetto location) E CANCELLA LE ALTRE NON INSERITE, 
        // I campi come location.type e location.address vengono effettivamente eliminati, non reimpostati ai valori di default
        // updateData.location = { coordinates: [45.4, 9.2] };
//         Il termine "dot notation" si riferisce a come MongoDB gestisce i percorsi dei campi con punti
// Usando le parentesi quadre come updateData['location.coordinates'] stai creando una proprietà letteralmente chiamata "location.coordinates"
// MongoDB sa interpretare questo come "aggiorna solo il campo coordinates all'interno dell'oggetto location"

    if (otherUpdates.location?.coordinates) {
        updateData['location.coordinates'] = otherUpdates.location.coordinates;
      }
      if (otherUpdates.location?.address?.city) {
        updateData['location.address.city'] = otherUpdates.location.address.city;
        // direttamente a mondoDB nome oggetto e accesso alla proprietà dell'oggetto [ fra parentesi quadre] = e assegno il valore 
      }
      if (otherUpdates.location?.address?.country) {
        updateData['location.address.country'] = otherUpdates.location.address.country;
      }
      if (otherUpdates.location?.address?.formattedAddress) {
        updateData['location.address.formattedAddress'] = otherUpdates.location.address.formattedAddress;
      }

    // Gestione separata per l'aggiornamento password
   

      
    // !Questa parte è necessaria nonostante il middleware pre('save') perché:

    // Il middleware di mongoose si attiva solo con save() o create(), quindi il !findByIdAndUpdate NON attiva il middleware pre('save')
    // Inoltre, qui fai una verifica della password attuale, cosa che non faresti nel middleware

     if (newPassword) {
        // Verifica password attuale
        const user = await User.findById(userId);
        const isPasswordValid = await user.comparePassword(currentPassword);
        // Internamente chiama bcrypt.compare(password, user.password)
        
        if (!isPasswordValid) {
          return response.status(401).json({ message: "Password attuale non valida" });
        }
        
        // Crea hash della nuova password
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(newPassword, salt);
      }

        // 3. Aggiorna l'utente se ci sono campi da aggiornare
    if (Object.keys(updateData).length === 0) {
        return response.status(400).json({ message: "Nessun campo da aggiornare" });
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select("-password -__v");
      
      response.status(200).json({
        message: "Utente aggiornato con successo",
        user: updatedUser
      })

        }catch(error){
            console.error()
            response.status(500).json({})
        }
    }     

    



    // TODO --- PUT AGGIORNA BANNER STORE


export const updateStoreBanner = async (request,response) =>{
    try{ 
        const userId = request.user.id;
        
        if(!request.file){
            return response.status(400).json({message: "Nessuna immagine caricata"})

        }
            // Salva l'URL dell'immagine caricata
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { storeBanner: request.file.path},
                {new: true}
            ).select("-password -__v")

            response.status(200).json({
                message:"Banner del negozio aggiornato",
                user: updatedUser  // Variabile non definita
            })
        }catch(error){
            console.error("Errore nell'aggiornamento del banner del negozio:", error);
            response.status(500).json({ message: "Errore nel server" });
        }
            
    }

//     Per modificare un post, usi l'ID del post perché stai modificando un documento specifico
// Per modificare il banner, usi l'ID dell'utente corrente perché stai modificando un campo dell'utente stesso


    export const removeStoreBanner = async (request, response) => {
        try {
          const userId = request.user.id;
          
          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { storeBanner: "default-store-banner.jpg" },
            { new: true }
          ).select("-password");
          
          response.status(200).json({
            message: "Banner rimosso con successo",
            user: updatedUser
          });
        } catch (error) {
          console.error("Errore nella rimozione del banner:", error);
          response.status(500).json({ message: "Errore nel server" });
        }
      };


export const getSellerReviews = async (request, response) => {
    try {
      const { sellerId } = request.params;
      
      // Verifica se l'utente esiste
      const seller = await User.findById(sellerId);
      if (!seller) {
        return response.status(404).json({ message: "Venditore non trovato" });
      }
      
      // Trova tutti gli ordini completati con recensioni per questo venditore
      const reviews = await Order.find({
        seller: sellerId,
        status: "delivered",
        "review.rating": { $exists: true }
      })
      .select("review buyer createdAt")
      .populate("buyer", "firstName lastName username profilePicture")
      .sort({ createdAt: -1 })
      .lean();
      
      // Calcola le statistiche
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, order) => sum + order.review.rating, 0) / totalReviews 
        : 0;
      
      response.status(200).json({
        reviews,
        status: {
          totalReviews,
          averageRating: parseFloat(averageRating.toFixed(1))
        }
      });
    } catch (error) {
      console.error("Errore nel recupero delle recensioni:", error);
      response.status(500).json({ message: "Errore nel server" });
    }
  };



                                 
   
    
// Controller per ottenere i dettagli di un utente tramite ID
export const getUserById = async (request, response) => {
    try {
      // Estrae l'ID dalla URL
      const { id } = request.params;
      
      // Trova l'utente senza includere la password
      const user = await User.findById(id).select('-password -__v');
      
      // Se l'utente non esiste
      if (!user) {
        return response.status(404).json({ message: "Utente non trovato" });
      }
      
      // Trova il numero di follower e following
      const followersCount = user.followers.length;
      const followingCount = user.following.length;
      
      // Trova il numero di articoli in vendita dell'utente
      
      const itemsCount = await Item.countDocuments({ 
        seller: id, 
        status: 'available' 
      });
      
      // Restituisci i dati dell'utente con conteggi
      response.status(200).json({
        user,
        stats: {
          followersCount,
          followingCount,
          itemsCount
        }
      });
      
    } catch (error) {
      console.error("Errore nel recupero dell'utente:", error);
      response.status(500).json({ message: "Errore nel server" });
    }
  };
    


  // Aggiungi questa funzione al tuo controller esistente

export const searchUsers = async (request, response) => {
  try {
    const { query } = request.query;
    const currentUserId = request.user.id;
    
    // Se non c'è una query, restituisci una lista vuota
    if (!query || query.trim() === '') {
      return response.status(200).json([]);
    }
    
    // Crea una regex per la ricerca case-insensitive
    const searchRegex = new RegExp(query.trim(), 'i');
    
    // Cerca utenti che corrispondono alla query nei campi rilevanti
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Esclude l'utente corrente
        {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { username: searchRegex },
            { email: searchRegex }
          ]
        }
      ]
    })
    .select('_id firstName lastName username profilePicture')
    .limit(8) // Limita a 8 risultati per prestazioni
    .lean();
    
    // Calcola un punteggio di corrispondenza per ordinare i risultati
    const scoredUsers = users.map(user => {
      let score = 0;
      
      // Username esatto
      if (user.username.toLowerCase() === query.toLowerCase()) score += 10;
      // Username inizia con la query
      else if (user.username.toLowerCase().startsWith(query.toLowerCase())) score += 5;
      // Username contiene la query
      else if (user.username.toLowerCase().includes(query.toLowerCase())) score += 3;
      
      // Nome/cognome
      if (`${user.firstName} ${user.lastName}`.toLowerCase() === query.toLowerCase()) score += 8;
      else if (`${user.firstName} ${user.lastName}`.toLowerCase().startsWith(query.toLowerCase())) score += 4;
      else if (`${user.firstName} ${user.lastName}`.toLowerCase().includes(query.toLowerCase())) score += 2;
      
      return {
        ...user,
        score
      };
    });
    
    // Ordina per punteggio e restituisci i risultati
    scoredUsers.sort((a, b) => b.score - a.score);
    
    response.status(200).json(scoredUsers);
  } catch (error) {
    console.error("Errore nella ricerca utenti:", error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};

// In Project_Final/controllers/userController.js
export const getUserByUsername = async (request, response) => {
  try {
    const { username } = request.params;
    
    // Trova l'utente per username
    const user = await User.findOne({ username });
    
    if (!user) {
      return response.status(404).json({ message: "Utente non trovato" });
    }
    
    return response.status(200).json(user);
  } catch (error) {
    console.error("Errore nel recupero utente per username:", error);
    return response.status(500).json({ message: "Errore del server" });
  }
};

    
    // uploadmulterCloudinary gestisce già il caricamento delle immagini

export const updateProfilePicture = async (request, response) => {
    try {
      const userId = request.user.id;
      
      if (!request.file) {
        return response.status(400).json({ message: "Nessuna immagine caricata" });
      }
      
      // Salva l'URL dell'immagine caricata
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePicture: request.file.path },
        { new: true }
      ).select("-password");
      
      response.status(200).json({
        message: "Immagine profilo aggiornata",
        user: updatedUser
      });
    } catch (error) {
      console.error("Errore nell'aggiornamento dell'immagine profilo:", error);
      response.status(500).json({ message: "Errore nel server" });
    }
  };
    



 // Controller per seguire un altro utente
export const followUser = async (request, response) => {
    try {
      // ID dell'utente da seguire
      const { id } = request.params;
      
      // ID dell'utente autenticato
      const userId = request.user.id;
      
      // Non permettere di seguire se stessi
      if (id === userId) {
        return response.status(400).json({ 
          message: "Non puoi seguire te stesso" 
        });
      }
      
      // Trova l'utente da seguire
      const userToFollow = await User.findById(id);
      
      // Se l'utente non esiste
      if (!userToFollow) {
        return response.status(404).json({ 
          message: "Utente da seguire non trovato" 
        });
      }
      
      // Trova l'utente autenticato
      const currentUser = await User.findById(userId);
      
      // Controlla se l'utente sta già seguendo l'altro
      const alreadyFollowing = currentUser.following.includes(id);
      
      if (alreadyFollowing) {
        return response.status(400).json({ 
          message: "Stai già seguendo questo utente" 
        });
      }
      
      // Aggiorna entrambi gli utenti in parallelo
      await Promise.all([
        // Aggiungi l'utente da seguire alla lista "following" dell'utente corrente
        User.findByIdAndUpdate(
          userId, 
          { $push: { following: id } }
        ),
        
        // Aggiungi l'utente corrente alla lista "followers" dell'utente da seguire
        User.findByIdAndUpdate(
          id, 
          { $push: { followers: userId } }
        )
      ]);
      
      response.status(200).json({ 
        message: "Utente seguito con successo" 
      });
      
    } catch (error) {
      console.error("Errore nel seguire l'utente:", error);
      response.status(500).json({ message: "Errore nel server" });
    }
  };
    
    

// Controller per smettere di seguire un utente
export const unfollowUser = async (request, response) => {
    try {
      // ID dell'utente da non seguire più
      const { id } = request.params;
      
      // ID dell'utente autenticato
      const userId = request.user.id;
      
      // Non permettere di smettere di seguire se stessi
      if (id === userId) {
        return response.status(400).json({ 
          message: "Non puoi smettere di seguire te stesso" 
        });
      }
      
      // Trova l'utente da non seguire più
      const userToUnfollow = await User.findById(id);
      
      // Se l'utente non esiste
      if (!userToUnfollow) {
        return response.status(404).json({ 
          message: "Utente da non seguire più non trovato" 
        });
      }
      
      // Trova l'utente autenticato
      const currentUser = await User.findById(userId);
      
      // Controlla se l'utente sta seguendo l'altro
      const isFollowing = currentUser.following.includes(id);
      
      if (!isFollowing) {
        return response.status(400).json({ 
          message: "Non stai seguendo questo utente" 
        });
      }
      
      // Aggiorna entrambi gli utenti in parallelo
      await Promise.all([
        // Rimuovi l'utente da non seguire più dalla lista "following" dell'utente corrente
        User.findByIdAndUpdate(
          userId, 
          { $pull: { following: id } }
        ),
        
        // Rimuovi l'utente corrente dalla lista "followers" dell'utente da non seguire più
        User.findByIdAndUpdate(
          id, 
          { $pull: { followers: userId } }
        )
      ]);
      
      response.status(200).json({ 
        message: "Hai smesso di seguire l'utente con successo" 
      });
      
    } catch (error) {
      console.error("Errore nello smettere di seguire l'utente:", error);
      response.status(500).json({ message: "Errore nel server" });
    }
  };
  




// Controller per ottenere i follower di un utente
export const getUserFollowers = async (request, response) => {
    try {
      // ID dell'utente di cui ottenere i follower
      const { id } = request.params;
      
      // Parametri di paginazione
      const { page = 1, limit = 10 } = request.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      
      // Trova l'utente
      const user = await User.findById(id);
      
      // Se l'utente non esiste
      if (!user) {
        return response.status(404).json({ 
          message: "Utente non trovato" 
        });
      }
      
      // Conta il totale di follower
      const totalFollowers = user.followers.length;
      
      // Trova i follower con paginazione
      const userPopulated = await User.findById(id)
        .populate({
          path: 'followers',
          select: 'firstName lastName username profilePicture bio',
          options: {
            limit: limitNum,
            skip: skip
          }
        });
      
      // Estrai i follower dall'utente popolato
      const followers = userPopulated.followers;
      
      response.status(200).json({
        followers,
        pagination: {
          total: totalFollowers,
          pages: Math.ceil(totalFollowers / limitNum),
          current: pageNum
        }
      });
      
    } catch (error) {
      console.error("Errore nel recupero dei follower:", error);
      response.status(500).json({ message: "Errore nel server" });
    }
  };
    
    
// Controller per ottenere gli utenti seguiti da un utente
export const getUserFollowing = async (request, response) => {
    try {
      // ID dell'utente di cui ottenere i seguiti
      const { id } = request.params;
      
      // Parametri di paginazione
      const { page = 1, limit = 10 } = request.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      
      // Trova l'utente
      const user = await User.findById(id);
      
      // Se l'utente non esiste
      if (!user) {
        return response.status(404).json({ 
          message: "Utente non trovato" 
        });
      }
      
      // Conta il totale di seguiti
      const totalFollowing = user.following.length;
      
      // Trova i seguiti con paginazione
      const userPopulated = await User.findById(id)
        .populate({
          path: 'following',
          select: 'firstName lastName username profilePicture bio',
          options: {
            limit: limitNum,
            skip: skip
          }
        });
      
      // Estrai i seguiti dall'utente popolato
      const following = userPopulated.following;
      
      response.status(200).json({
        following,
        pagination: {
          total: totalFollowing,
          pages: Math.ceil(totalFollowing / limitNum),
          current: pageNum
        }
      });
      
    } catch (error) {
      console.error("Errore nel recupero degli utenti seguiti:", error);
      response.status(500).json({ message: "Errore nel server" });
    }
  };




// Processo di Refresh Token Spiegato
// Ecco come funziona nella tua applicazione:

// L'utente fa login → riceve accessToken (30 min) e refreshToken (7 giorni)
// Quando fa richieste API, usa l'accessToken nell'header Authorization: Bearer <token>
// Dopo 30 minuti, l'API risponderà 401 Unauthorized
// Il frontend intercetta questo errore e chiama automaticamente /api/v3/users/refresh-token
// Se il refreshToken è valido, restituisce un nuovo accessToken e continua normalmente
// Se anche il refreshToken è scaduto (dopo 7 giorni), reindirizza al login

    

// Sistema a doppio token:

// Access token: Breve durata (15-30 minuti), usato per l'autenticazione
// Refresh token: Lunga durata (7-30 giorni), memorizzato in HTTP-only cookie


// Login controller

// Lo schema definisce i comportamenti del modello (confrontare password)
// Il controller usa questi comportamenti per implementare le funzionalità (login)




  // Controller per autenticare un utente
export const loginUser = async (request, response) => {
    try {
      // Estrai email e password dalla richiesta
      const { email, password } = request.body;
      
      // Verifica che siano stati forniti email e password
      if (!email || !password) {
        return response.status(400).json({ 
          message: "Email e password sono richiesti" 
        });
      }
      
      // Trova l'utente con questa email
      const user = await User.findOne({ email });
      
      // Se non esiste un utente con questa email
      if (!user) {
        return response.status(404).json({ 
          message: "Utente non trovato" 
        });
      }
      
      // Verifica la password usando il metodo definito nello schema User
      const isPasswordValid = await user.comparePassword(password);
      
      // Se la password non è valida
      if (!isPasswordValid) {
        return response.status(401).json({ 
          message: "Password non valida" 
        });
      }
      
      // Password valida: genera i token
      // Genera un nuovo access token
    //Viene dal token precedentemente verificato; quando verifichi un token, ottieni indietro il payload (che contiene l'id)

        // GENERA TOKEN
    
      const accessToken = jwt.sign(
        { id: user._id },
        // { id: user._id } = { id: user._id }: Sta creando un oggetto con proprietà id che contiene il valore di _id del documento MongoDB
 
        process.env.JWT_SECRET, 
        { expiresIn: '30m' }
      );
      
      const refreshToken = jwt.sign(
        { id: user._id }, 
        process.env.REFRESH_SECRET, 
        { expiresIn: '7d' }
      );
      
      // Salva refresh token in cookie HTTP-only
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS solo in produzione
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni in millisecondi
      });
      
      // Prepara l'oggetto utente senza password per la risposta
      const userWithoutPassword = user.toObject();
      delete userWithoutPassword.password;
      
      // Invia token e dati utente
      response.status(200).json({
        message: "Login effettuato con successo",
        user: userWithoutPassword,
        accessToken
      });
      
    } catch (error) {
      console.error("Errore durante il login:", error);
      response.status(500).json({ message: "Errore nel server" });
    }
  }


// Aggiorna refreshAccessToken per supportare tutti i casi

export const refreshAccessToken = async (request, response) => {
  try {
    // Ottieni il refresh token dai cookie
    const refreshToken = request.cookies.refreshToken;
    
    // Controlla anche header Authorization come fallback
    const authHeader = request.headers.authorization;
    let tokenFromHeader = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      tokenFromHeader = authHeader.substring(7);
    }
    
    // Verifica se il token esiste in uno dei due luoghi
    if (!refreshToken && !tokenFromHeader) {
      return response.status(401).json({ message: 'Token di refresh mancante' });
    }
    
    // Prova prima con il cookie, poi con l'header
    let decoded;
    let tokenToUse = refreshToken || tokenFromHeader;
    
    try {
      decoded = jwt.verify(tokenToUse, process.env.REFRESH_SECRET);
    } catch (error) {
      console.log("⚠️ Errore verifica refresh token:", error.message);
      return response.status(401).json({ message: 'Token di refresh non valido o scaduto' });
    }
    
    // Controlla che l'utente esista ancora
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return response.status(404).json({ message: 'Utente non trovato' });
    }
    
    // Genera un nuovo access token E un nuovo refresh token
    const accessToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30m' }
    );
    
    const newRefreshToken = jwt.sign(
      { id: user._id }, 
      process.env.REFRESH_SECRET, 
      { expiresIn: '7d' }
    );
    
    // Imposta il nuovo refresh token nel cookie
    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni
    });
    
    // Invia il nuovo access token
    response.status(200).json({ 
      accessToken,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Errore nel refresh del token:', error);
    response.status(500).json({ message: 'Errore del server' });
  }
};


// ! se c'è tempo 
//   export const getSuggestedUsers = async (request, response) => {
//     try {
//       const userId = request.user.id;
      
//       // Trova l'utente corrente con la lista dei suoi following
//       const currentUser = await User.findById(userId).select('following');
      
//       // Prepara la query per trovare utenti che non segui già
//       const query = {
//         // Escludi l'utente corrente
//         _id: { $ne: userId },
//         // Escludi gli utenti che già segui
//         _id: { $nin: currentUser.following }
//       };
      
//       // Trova utenti suggeriti, ordinati per qualche criterio (es. popolarità)
//       const suggestedUsers = await User.find(query)
//         .select('firstName lastName username profilePicture bio')
//         .sort({ followersCount: -1 }) // Ordina per numero di follower
//         .limit(10);
      
//       response.status(200).json(suggestedUsers);
//     } catch (error) {
//       console.error("Errore nel recupero degli utenti suggeriti:", error);
//       response.status(500).json({message: "Errore nel server"});
//     }
//   };