import Item from "../models/item.js";
import Comment from "../models/comment.js";
import Story from "../models/story.js"
import User from "../models/user.js"



// Spiegazione di $$ROOT
// $$ROOT è un operatore speciale di MongoDB che si usa nelle operazioni di aggregazione.
//  Rappresenta l'intero documento corrente. Quando usi $push: "$$ROOT" stai dicendo a MongoDB di aggiungere l'intero oggetto item (con tutti i suoi campi e valori) all'array che stai creando per ogni venditore.



// TODO Ottiene tutti gli items raggruppati per venditore (formato "negozio")
//   Supporta filtri per categoria, condizione e include storie dei venditori

export const getItems = async (request, response) => {
  try {
    
    const userId = request.user.id; // ID dell'utente autenticato
    
    // Estrai i parametri di paginazione dalla query
    const { page = 1, limit = 10, category, condition } = request.query;
    
    // Converti i parametri in numeri
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Calcola quanti risultati saltare
    const skip = (pageNum - 1) * limitNum;
    
    // Prepara le condizioni di ricerca base
    let conditions = { 
      status: "available",
      // NUOVO: Escludi gli item dell'utente corrente quando visualizza il marketplace
      seller: { $ne: userId }
    };    // Solo prodotti disponibili
    
    // Aggiunge il filtro per categoria se specificato
    if (category) {
      conditions.category = category;
    }
    
    // Aggiunge il filtro per condizione dell'articolo se specificato
    if (condition) {
      conditions.condition = condition;
    }
    
    // NUOVA IMPLEMENTAZIONE: Raggruppa sempre per venditore (negozi)
    
    // 1. Esegui l'aggregazione per raggruppare items per venditore
    // Utilizza il framework di aggregazione di MongoDB per trasformare i dati
    const storeItems = await Item.aggregate([
      { $match: conditions },                // Filtra gli items in base alle condizioni specificate
      { $sort: { createdAt: -1 } },          // Ordina per data di creazione decrescente (più recenti prima)
      {
        $group: {
          _id: "$seller",                   // Raggruppa risultati per ID venditore
          items: { $push: "$$ROOT" },       // Per ogni gruppo, crea un array con tutti gli item completi
          itemCount: { $sum: 1 },           // Conta quanti item ha ogni venditore
          latestItem: { $first: "$$ROOT" }, // Memorizza il primo item (il più recente, grazie all'ordinamento)
          categories: { $addToSet: "$category" } // Raccoglie tutte le categorie uniche vendute da questo venditore
        }
      },
      { $skip: skip },                      // Salta i risultati per la paginazione
      { $limit: limitNum }                  // Limita il numero di risultati restituiti
    ]);
    
    // 2. Conta il totale dei venditori per calcolare la paginazione
    // Questa è una query separata che conta quanti venditori unici ci sono
    const totalSellers = await Item.aggregate([
      { $match: conditions },               // Applica gli stessi filtri della query principale
      { $group: { _id: "$seller" } },       // Raggruppa per venditore (per contare venditori unici)
      { $count: "total" }                   // Conta il totale dei gruppi (venditori)
    ]);
    
    // Estrai il numero totale di venditori, o imposta a 0 se non ci sono risultati
    const total = totalSellers.length > 0 ? totalSellers[0].total : 0;
    
    // 3. Popola i dati dei venditori
    // Converte gli ID dei venditori in oggetti completi con i dati del profilo
    await Item.populate(storeItems, {
      path: '_id',                          // Il campo '_id' contiene l'ID del venditore
      select: 'firstName lastName username profilePicture bio', // Campi da includere
      model: 'User'                         // Modello da utilizzare per popolare i dati
    });
    
    // 4. Cerca le storie associate ai venditori
    // Per ogni negozio, verifica se ha storie attive da mostrare
    const now = new Date();
    const storesWithStories = await Promise.all(storeItems.map(async (store) => {
      // Cerca storie attive di questo venditore
      const stories = await Story.find({
        author: store._id._id,              // '_id._id' perché store._id è l'oggetto venditore popolato
        expiresAt: { $gt: now }             // Solo storie non ancora scadute
      })
      .sort({ createdAt: -1 })              // Ordina per più recenti
      .limit(5)                             // Limita a 5 storie per venditore
      .select('media');                     // Seleziona solo i dati media necessari
      
      // Restituisci lo store originale con informazioni aggiuntive sulle storie
      return {
        ...store,                           // Mantieni tutti i dati originali dello store
        hasStories: stories.length > 0,     // Flag che indica se ci sono storie
        storyCount: stories.length          // Numero di storie attive
      };
    }));
    
    // 5. Invia la risposta formattata
    response.status(200).json({
      stores: storesWithStories.map(store => ({
        seller: store._id,                  // Dati del venditore (popolati dalla query)
        latestItem: store.latestItem,       // Item più recente del venditore
        itemCount: store.itemCount,         // Numero totale di prodotti del venditore
        categories: store.categories,       // Categorie vendute da questo venditore
        hasStories: store.hasStories,       // Flag che indica se ci sono storie da mostrare
        storyCount: store.storyCount,       // Numero di storie attive
        previewItems: store.items.slice(0, 3) // Solo i primi 3 item per anteprima
      })),
      totalPages: Math.ceil(total / limitNum), // Calcola il numero totale di pagine
      currentPage: pageNum,                   // Pagina corrente
      totalStores: total                      // Numero totale di negozi
    });
  } catch (error) {
    console.error("Errore nel recupero degli items:", error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};


// TODO --- GET : OTTINI UN ITEM 

export const getItemById = async (request, response) => {
  try {
    // Estraggo l'ID dell'item dalla richiesta
    const { id } = request.params;
    
    // Opzionalmente estraggo parametri per la paginazione dei commenti
    const { commentPage = 1, commentLimit = 5 } = request.query;
    
    // Converto in numeri e calcolo lo skip per i commenti
    const commentPageNum = parseInt(commentPage);
    const commentLimitNum = parseInt(commentLimit);
    const commentSkip = (commentPageNum - 1) * commentLimitNum;
    
    // Trovo l'item e popolo i dati del venditore
    const item = await Item.findById(id)
      .populate("seller", "firstName lastName username profilePicture sellerRating")
      .lean({ virtuals: true }); // AGGIUNTO: virtuals per eventuali campi virtuali
    
    // Verifico se l'item esiste
    if (!item) {
      return response.status(404).json({ message: "Item non trovato" });
    }
    
    // Incremento il contatore delle visualizzazioni
    // await Item.findByIdAndUpdate(id, { $inc: { views: 1 } });
    
    // Trovo i commenti principali con paginazione
    const comments = await Comment.find({ 
      item: id, // Filtro per commenti associati a questo item (non a un post)
      parentComment: null // Solo commenti principali (non risposte)
    })
    .sort({ createdAt: -1 }) // Dal più recente
    .skip(commentSkip)
    .limit(commentLimitNum)
    .populate("author", "firstName lastName username profilePicture")
    .lean();
    
    // Per ogni commento principale, trovo le prime risposte
    const commentsWithReplies = await Promise.all(comments.map(async comment => ({
      ...comment,
      replies: await Comment.find({ parentComment: comment._id })
        .sort({ createdAt: 1 })
        .limit(3)
        .populate("author", "firstName lastName username profilePicture")
        .lean()
    })));
    
    // Conto il totale dei commenti principali per la paginazione
    const totalComments = await Comment.countDocuments({ 
      item: id,  // Filtra i commenti associati a questo item ( ho la ref lo schema Comment per gli item)
      parentComment: null  // Solo commenti principali
    });
    
    // Trovo eventuali post correlati 
    const relatedPost = item.relatedPost ? 
      await Post.findById(item.relatedPost)
        .populate("author", "firstName lastName username profilePicture")
        .lean({ virtuals: true }) 
      : null;
    
    // Invio la risposta completa
    response.status(200).json({
      item,
      relatedPost,
      comments: commentsWithReplies,
      commentPagination: {
        totalPages: Math.ceil(totalComments / commentLimitNum),
        currentPage: commentPageNum,
        totalComments
      }
    });
    
  } catch (error) {
    console.error("Errore nel recupero dell'item:", error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};



// TODO --- ricerca avanzata per filtri degli items: 



export const searchItems = async (request, response) => {
  try {
   
    const userId = request.user.id;

    
    // Estrai tutti i parametri di ricerca dalla query
    const {
      query,                                 // Testo da cercare (nome, descrizione)
      category,                              // Categoria del prodotto
      minPrice,                              // Prezzo minimo
      maxPrice,                              // Prezzo massimo
      condition,                             // Condizione dell'articolo
      seller,                                // ID del venditore
      sortBy = "newest",                     // Criterio di ordinamento (default: più recenti)
      page = 1,                              // Pagina corrente
      limit = 12,                            // Elementi per pagina
      city, country, distance = 50,          // Parametri di localizzazione
      groupByStore = 'true'                  // Raggruppa per negozio (default: true)
    } = request.query;
    
    // Converti e calcola la paginazione
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
  // Prepara le condizioni di base (solo prodotti disponibili)
  let conditions = { 
    status: "available",
    // NUOVO: Escludi i prodotti dell'utente corrente dai risultati di ricerca
    seller: { $ne: userId } 
  };

    // Aggiunge la ricerca testuale se specificata
    if (query) {
      conditions.$or = [
        { name: { $regex: query, $options: "i" } },      // Cerca nel nome (case insensitive)
        { description: { $regex: query, $options: "i" } } // Cerca nella descrizione
      ];
    }
    
    // Aggiunge filtro per categoria
    if (category) {
      conditions.category = category;
    }
    
    // Aggiunge filtro per condizione
    if (condition) {
      conditions.condition = condition;
    }
    
    // Aggiunge filtro per venditore
    if (seller) {
      conditions.seller = seller;
    }
    
    // Aggiunge filtro per prezzo
    if (minPrice !== undefined || maxPrice !== undefined) {
      conditions["price.amount"] = {};
      if (minPrice !== undefined) {
        conditions["price.amount"].$gte = Number(minPrice); // Maggiore o uguale al prezzo minimo
      }
      if (maxPrice !== undefined) {
        conditions["price.amount"].$lte = Number(maxPrice); // Minore o uguale al prezzo massimo
      }
    }
    
    // Definisce le opzioni di ordinamento
    const sortOptionMap = {
      newest: { createdAt: -1 },            // Più recenti prima
      oldest: { createdAt: 1 },             // Più vecchi prima
      priceAsc: { "price.amount": 1 },      // Prezzo crescente
      priceDesc: { "price.amount": -1 },    // Prezzo decrescente
      popular: { views: -1 }                // Più visti prima
    };
    
    // Seleziona l'ordinamento richiesto o usa il default
    const sortOptions = sortOptionMap[sortBy] || sortOptionMap.newest;
    
    // NUOVA LOGICA: Raggruppa per negozio se richiesto
    if (groupByStore === 'true') {
      // Esegue l'aggregazione simile a getItems, ma con condizioni di ricerca avanzata
      const storeItems = await Item.aggregate([
        { $match: conditions },              // Filtra in base a tutte le condizioni specificate
        { $sort: sortOptions },              // Applica l'ordinamento selezionato
        {
          $group: {
            _id: "$seller",                 // Raggruppa per venditore
            items: { $push: "$$ROOT" },     // Salva tutti gli item del venditore
            itemCount: { $sum: 1 },         // Conta quanti item corrispondono ai criteri
            matchScore: { $sum: 1 }         // Punteggio per ordinare negozi per rilevanza
          }
        },
        { $sort: { matchScore: -1 } },      // Ordina negozi per numero di match (più rilevanti prima)
        { $skip: skip },                    // Applica paginazione
        { $limit: limitNum }                // Limita numero di risultati
      ]);
      
      // Popola i dettagli del venditore
      await Item.populate(storeItems, {
        path: '_id',                        // Campo che contiene l'ID venditore
        select: 'firstName lastName username profilePicture bio', // Campi da includere
        model: 'User'                       // Modello da utilizzare
      });
      
      // Conta il totale dei negozi che corrispondono ai criteri
      const totalStores = await Item.aggregate([
        { $match: conditions },             // Stesse condizioni della query principale
        { $group: { _id: "$seller" } },     // Raggruppa per venditore (conta negozi unici)
        { $count: "total" }                 // Conta il totale
      ]);
      
      // Estrai il numero totale o imposta a 0 se non ci sono risultati
      const total = totalStores.length > 0 ? totalStores[0].total : 0;
      
      // Cerca storie per ogni negozio
      const now = new Date();
      const storesWithStories = await Promise.all(storeItems.map(async (store) => {
        // Trova storie attive per questo venditore
        const stories = await Story.find({
          author: store._id._id,            // ID del venditore
          expiresAt: { $gt: now }           // Solo storie non scadute
        })
        .sort({ createdAt: -1 })            // Ordina per più recenti
        .limit(5)                           // Limita a 5 storie
        .select('media');                   // Seleziona solo campi necessari
        
        // Aggiungi info storie allo store
        return {
          ...store,
          hasStories: stories.length > 0,   // Flag se ci sono storie
          storyCount: stories.length        // Numero storie
        };
      }));
      
      // Formatta e invia risposta
      return response.status(200).json({
        stores: storesWithStories.map(store => ({
          seller: store._id,                // Dati venditore
          matchingItems: store.itemCount,   // Numero item che corrispondono alla ricerca
          hasStories: store.hasStories,     // Flag storie
          storyCount: store.storyCount,     // Conteggio storie
          previewItems: store.items.slice(0, 3) // Primi 3 item per anteprima
        })),
        totalPages: Math.ceil(total / limitNum), // Totale pagine
        currentPage: pageNum,                   // Pagina corrente
        totalStores: total                      // Totale negozi
      });
    } else {
      // Comportamento originale: cerca e restituisci singoli item
      const items = await Item.find(conditions)
        .sort(sortOptions)                  // Applica ordinamento
        .skip(skip)                         // Salta per paginazione
        .limit(limitNum)                    // Limita risultati
        .populate("seller", "firstName lastName username profilePicture sellerRating")
        .lean();                            // Converte in oggetto JS puro
      
      // Conta totale per paginazione
      const total = await Item.countDocuments(conditions);
      
      // Invia risposta standard
      return response.status(200).json({
        items,                              // Lista di item individuali
        totalPages: Math.ceil(total / limitNum), // Totale pagine
        currentPage: pageNum,                   // Pagina corrente
        totalItems: total                       // Totale item
      });
    }
  } catch (error) {
    console.error("Errore nella ricerca:", error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};


// TODO ---POST: CREA UN ITEM (PRODOTTO)
  
  export const createItem = async (request, response) => {
    try {
      const {
        name,
        description,
        price: priceData, // PRICE è UN OGGETTO DI OGGETTI ECCO PERCHE PRICE : priceData
        category,
        condition,
        shipping: shippingData = {}
      } = request.body;
  
      const seller = request.user.id; // id user dal middleware AuthMiddleware
                                      // Estrai l'ID del venditore dall'utente autenticato
                                      // Usiamo "seller" perché negli item l'utente agisce come venditore
                                      // Questo nome corrisponde al campo nello schema Item e riflette il ruolo commerciale dell'utente
  
      if (!request.file) return response.status(400).json({ message: "Cover image richiesta" });
           
      // Prepara l'oggetto price in base allo schema
      const price = {
        amount: priceData?.amount || (typeof priceData === 'number' ? priceData : 0), // Supporta sia oggetto che numero diretto
        currency: priceData?.currency || "EUR",
        negotiable: priceData?.negotiable || false
      };
        
      // Prepara l'oggetto shipping
      const shipping = {
        available: shippingData?.available !== false, // Default true
        cost: shippingData?.cost || 0,
        methods: shippingData?.methods || ["Standard"]
      };
  
      const images = [{
        url: request.file.path,
        isPrimary: true,
      }];
  
      // Se ci sono immagini aggiuntive (in caso di upload multipli in futuro)
      if (request.files && request.files.length > 1) {
        const additionalImages = request.files.slice(1).map((file, index) => ({
          url: file.path,
          isPrimary: false // Le immagini aggiuntive non sono primarie
        }));
        images.push(...additionalImages);
      }


      const newItem = new Item({
        name,
        description,
        seller,
        images,
        price,
        category,
        condition,
        shipping
      });
  
      // Salva l'item nel database
      await newItem.save();
      
      // Carica l'item salvato con il venditore popolato e virtuals per la risposta
      const savedItem = await Item.findById(newItem._id)
        .populate("seller", "firstName lastName username")
        .lean({ virtuals: true });
  
      response.status(201).json({
        message: "Item creato con successo",
        item: savedItem
      });
    }
    catch(error) {
      console.error("Errore nella creazione dell'item:", error);
      response.status(500).json({
        message: "Errore nel server", 
        error: error.message 
      });
    }
  }

  // TODO ---AGGIORNA O MODIFICA L'ITEM 
  
  export const updateItem = async (request, response) => {
    try {
      // Estrai ID del post dai parametri URL
      const { id } = request.params;
      
      // Estrai i dati dal corpo della richiesta
      const { 
        name,
        description,
        category,
        condition,
        price: priceData,
        shipping: shippingData
      } = request.body;
      
      // Usa il post già verificato dal middleware isPostAuthor
      const item = request.item;
      
      // Se stai usando il middleware isPostAuthor, questo controllo è già fatto lì
      // ma lo teniamo per sicurezza
      if (!item) {
        return response.status(404).json({ message: "Prodotto non trovato" });
      }
      
      // Prepara l'oggetto di aggiornamento con i campi forniti
      const updateData = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (category) updateData.category = category;
      if (condition) updateData.condition = condition;
      
      // Aggiorna il prezzo se fornito
      if (priceData) {
        updateData.price = {
          amount: priceData.amount || item.price.amount,
          currency: priceData.currency || item.price.currency,
          negotiable: priceData.negotiable !== undefined ? priceData.negotiable : item.price.negotiable
        };
      }
      
      // Aggiorna la spedizione se fornita
      if (shippingData) {
        updateData.shipping = {
          available: shippingData.available !== undefined ? shippingData.available : item.shipping.available,
          cost: shippingData.cost !== undefined ? shippingData.cost : item.shipping.cost,
          methods: shippingData.methods || item.shipping.methods
        };
      }
      
      // Se è stato caricato un file, aggiorna anche la copertina
      if (request.file) {
        // Prima imposta tutte le immagini esistenti come non principali
        await Item.updateOne(
          { _id: id },
          { $set: { "images.$[].isPrimary": false } }
        );
        
        // Poi aggiungi la nuova immagine come principale
        updateData.$push = {
          images: {
            url: request.file.path,
            isPrimary: true
          }
        };
      }

      if (Object.keys(updateData).length === 0) {
        return response.status(400).json({ message: "Nessuna modifica da applicare" });
      }
      
      // Aggiorna l'item
      const updatedItem = await Item.findByIdAndUpdate(
        id,
        updateData,
        { new: true,
          runValidators: true
         }
      )
      .populate("seller", "firstName lastName username profilePicture")
      .lean({ virtuals: true });
      
      // Invia la risposta
      response.status(200).json({
        message: "Item aggiornato con successo",
        item: updatedItem
      });
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'item:", error);
      response.status(500).json({ message: "Errore nel server", error: error.message });
    }
  }
    

  // aggiUNGE L'immagine o immagini di uno stesso item

  export const updateItemImage = async (request, response) => {
    try {
      const { id } = request.params;
      const { setAsPrimaryImage = true, replaceAll = false } = request.body;
      
      // Ottieni l'item dal middleware isItemAuthor
      const item = request.item;
      
      if (!item) {
        return response.status(404).json({ message: "Prodotto non trovato" });
      }
      
      // Verifica che sia stato caricato un file
      if (!request.file) {
        return response.status(400).json({ message: "Nessuna immagine caricata" });
      }
      
      let updatedItem;
      
      // Implementa la logica basata su replaceAll
      if (replaceAll) {
        // Sostituisci completamente tutte le immagini
        updatedItem = await Item.findByIdAndUpdate(
          id,
          { 
            images: [{
              url: request.file.path,
              isPrimary: true
            }]
          },
          { new: true }
        ).populate("seller", "firstName lastName username");
        
        response.status(200).json({
          message: "Tutte le immagini sostituite con successo",
          item: updatedItem
        });
      } else {
        // Comportamento originale: aggiungi una nuova immagine
        
        // Se setAsPrimaryImage è true, imposta tutte le immagini esistenti come non primarie
        if (setAsPrimaryImage) {  // SE è TRUE FA IL "CICLO" SET DI MONGODB, se è false procede comunque, AD INSERIRLA. 
          // per garantire unicità, ce ne può essere solo una primaria, quindi aggiorno la vecchia primaria come non primaria a favore dell'ultima

          await Item.updateOne(
            { _id: id },
            { $set: { "images.$[].isPrimary": false } }
          );
        }
        
        // Aggiungi la nuova immagine
        updatedItem = await Item.findByIdAndUpdate(
          id,
          {
            $push: {
              images: {
                url: request.file.path,
                isPrimary: setAsPrimaryImage
              }
            }
          },
          { new: true }
        ).populate("seller", "firstName lastName username");
        
        response.status(200).json({
          message: "Immagine aggiunta con successo",
          item: updatedItem
        });
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento dell'immagine:", error);
      response.status(500).json({ 
        message: "Errore nel server", 
        error: error.message 
      });
    }
  }


  



  // Controller per eliminare una singola immagine da un item
export const deleteItemImage = async (request, response) => {
  try {
    const { id } = request.params;         // ID dell'item
    const { imageId } = request.body;      // ID o indice dell'immagine da rimuovere
    
    const item = request.item;  // Ottieni l'item dal middleware isItemAuthor
    
    if (!item) {
      return response.status(404).json({ message: "Prodotto non trovato" });
    }
    
    if (!imageId) {
      return response.status(400).json({ message: "ID immagine non specificato" });
    }
    
    // Verifica che l'immagine esista nell'item
    const imageIndex = item.images.findIndex(img => img._id.toString() === imageId);
    
    if (imageIndex === -1) {
      return response.status(404).json({ message: "Immagine non trovata" });
    }
    
    // Non permettere di eliminare l'unica immagine
    if (item.images.length === 1) {
      return response.status(400).json({ 
        message: "Impossibile eliminare l'unica immagine dell'item. Carica prima una nuova immagine." 
      });
    }
    
    // Estrai l'URL dell'immagine da eliminare
    const imageUrl = item.images[imageIndex].url;
    
    // Rimuovi l'immagine dall'array
    await Item.findByIdAndUpdate(id, {
      $pull: { images: { _id: imageId } }
    });
    
    // Se l'immagine eliminata era principale, imposta la prima immagine rimasta come principale
    const updatedItem = await Item.findById(id);
    if (!updatedItem.images.some(img => img.isPrimary)) {
      await Item.findOneAndUpdate(
        { _id: id, "images.0": { $exists: true } },
        { $set: { "images.0.isPrimary": true } }
      );
    }
    
    response.status(200).json({ 
      message: "Immagine eliminata con successo" 
    });
    
  } catch (error) {
    console.error("Errore nell'eliminazione dell'immagine:", error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};



  export const deleteItem = async (request,response)=>{
    try{
        const{id}= request.params;
        const item = request.item; // ITEM già verificato dal middleware isItemtAuthor
        if(!item) return response.status(404).json({message: "Item non trovato"});
        await Item.findByIdAndDelete(id);
        response.status(200).json({message:"Item eliminato con successo"});

    }
    catch(error){
        console.error("Errore durante l'eliminazione dell'item:", error);
        response.status(500).json({message:"Errore nel server", error: error.message});
    }
            
        }
  


// TODO ---- GET : OTTIENI I COMMENTI DI UN ITEM (PRODOTTO): 



export const getItemComments = async (request, response) => {
  try {
    const { id } = request.params;
    const {
      commentPage = 1,
      commentLimit = 5,
      sortBy = "newest"
    } = request.query;

    const commentPageNum = parseInt(commentPage);
    const commentLimitNum = parseInt(commentLimit);
    const commentSkip = (commentPageNum - 1) * commentLimitNum;

    const existingItem = await Item.findById(id);
    if (!existingItem) return response.status(404).json({ message: "Item non trovato" });


    // Definisci opzioni di ordinamento in base al parametro sortBy
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      mostLiked: { "likes.length": -1 } // Se i commenti hanno likes
    };

   // Usa l'ordinamento richiesto o il default
   const sortOption = sortOptions[sortBy] || sortOptions.newest;



    // 1. Recupera i commenti principali con paginazione
    //Qui stai eseguendo la paginazione nel database, cioè:

    // Stai effettivamente recuperando solo i dati della pagina richiesta
    // La query MongoDB recupera solamente commentLimitNum commenti
    // Questa è l'operazione effettiva di paginazione sui dati
    // La paginazione viene eseguita direttamente nel database
    const comments = await Comment.find({ 
        item: id,
        parentComment: null // Solo commenti principali
    })
      .sort( sortOption)
      .skip(commentSkip)
      .limit(commentLimitNum)
      .populate("author", "firstName lastName username profilePicture") // Popola l'autore, non l'item
      .lean({ virtuals: true });

    // 2. Per ogni commento, trova le sue risposte (opzionale e con un limite)
    const commentsWithReplies = await Promise.all(comments.map(async comment => ({
      ...comment,
      replies: await Comment.find({ parentComment: comment._id })
        .sort({ createdAt: 1 })
        .limit(3)
        .populate("author", "firstName lastName username profilePicture")// usiamo author perché è l'unico modo per recuperare il nome e cognome dell'autore dei commenti,
        //  tra le tante reference nello schema comment
        .lean()
    })));

    // 3. Conta il totale dei commenti principali per la paginazione
    const totalCommentsItem = await Comment.countDocuments({ 
        item: id, 
        parentComment: null 
    });
    
    // 4. Restituisci il risultato con informazioni sulla paginazione
    //Il frontend ha bisogno di queste informazioni per mostrare:
        //La navigazione tra le pagine
        //Il numero totale di pagine
        //Quale pagina è attualmente visualizzata
    response.status(200).json({
      comments: commentsWithReplies, // Commenti con risposte
      commentPagination: {
        totalPages: Math.ceil(totalCommentsItem / commentLimitNum),
        currentPage: commentPageNum,
        totalComments: totalCommentsItem 
      }
    });
  } catch (error) {
    console.error("Errore nel recupero dei commenti:", error);
    response.status(500).json({
      message: "Errore nel server",
      error: error.message
    });
  }
};


// TODO --- AGGIUNG COMMENTO AD ITEM : 

  export const addItemComment = async (request,response)=>{
    try{
        const {id} = request.params;
        const {content, parentComment} = request.body
        
        const author = request.user.id; // ID dell'utente autenticato

        // Verificare che l'item esista
          const itemExists = await Item.findById(id);
          if (!itemExists) return response.status(404).json({message: "Item non trovato"});

        if (!content) return response.status(400).json({message:"Contenuto del commento richiesto"});        const newComment = await Comment.create({
            content,
            author,
            item:id,
            parentComment, // Se è una risposta, altrimenti null

        })
        response.status(201).json({
            message: "Commento aggiunto con successo",
            comment: newComment
        })

    }
    catch(error){
        console.error("Errore durante l'aggiunta del commento:", error)
        response.status(500).json({message: "Errore nel server", error: error.message})
    }
  }


  export const updateItemComment = async (request, response) => {
    try {
      const { id } = request.params; // ID del commento
      const { content } = request.body;
      const userId = request.user.id;
      
      // Verifica che il commento esista
      const comment = await Comment.findById(id);
      if (!comment) {
        return response.status(404).json({ message: "Commento non trovato" });
      }
      
      // Verifica che l'utente sia l'autore del commento

      // Quando NON usi .populate() nella funzione, 

      if (comment.author.toString() !== userId) {
         // Corretto! Qui author è già l'ID dell'utente, non un oggetto popolato
        return response.status(403).json({ message: "Non sei autorizzato a modificare questo commento" });
      }

      const updateData = {};
    if (content) updateData.content = content;
      
      if (Object.keys(updateData).length === 0) {
        return response.status(400).json({ message: "Nessuna modifica da applicare" });
      }

      // Aggiorna solo il contenuto
      const updatedComment = await Comment.findByIdAndUpdate(
        id,
        { content },
        { new: true, runValidators: true }
      ).populate("author", "firstName lastName username profilePicture");
      
      response.status(200).json({
        message: "Commento aggiornato con successo",
        comment: updatedComment
      });
    } catch (error) {
      console.error("Errore nell'aggiornamento del commento:", error);
      response.status(500).json({ message: "Errore nel server", error: error.message });
    }
  };



  export const deleteItemComment = async (request, response) => {
    try {
      const { id } = request.params; // ID del commento
      const userId = request.user.id;
      
      // Verifica che il commento esista
      const comment = await Comment.findById(id);
      if (!comment) {
        return response.status(404).json({ message: "Commento non trovato" });
      }
      
      // Verifica che sia un commento per un item (non per un post)
      if (!comment.item) {
        return response.status(400).json({ message: "Non è un commento per un item" });
      }
      
      // Verifica che l'utente sia l'autore del commento
      if (comment.author.toString() !== userId) {
        return response.status(403).json({ message: "Non sei autorizzato a eliminare questo commento" });
      }
      
      // Se è un commento principale, controlla se ha risposte
      const hasReplies = await Comment.exists({ parentComment: id });
      
      if (hasReplies) {
        // Opzione 1: Elimina il commento e tutte le sue risposte
        await Comment.deleteMany({ $or: [{ _id: id }, { parentComment: id }] });
      } else {
        // Opzione 2: Elimina solo il commento
        await Comment.findByIdAndDelete(id);
      }
      
      response.status(200).json({
        message: "Commento eliminato con successo"
      });
    } catch (error) {
      console.error("Errore nell'eliminazione del commento:", error);
      response.status(500).json({ message: "Errore nel server", error: error.message });
    }
  };


// TODO prende tutti i dettagli di uno store , 
export const getStoreDetails = async (request, response) => {
  try {
    const { sellerId } = request.params;
    const userId = request.user.id;
    
    // Controlla se l'utente sta visualizzando il proprio negozio
    const isOwnStore = userId === sellerId;
    
    // Verifica che il venditore esista
    const seller = await User.findById(sellerId).select("firstName lastName username profilePicture bio storeBanner");
    if (!seller) {
      return response.status(404).json({ message: "Venditore non trovato" });
    }
    
    // Query base per gli item del venditore
    const itemsQuery = { 
      seller: sellerId
    };
    
    // Se non è il proprio negozio, mostra solo item disponibili
    if (!isOwnStore) {
      itemsQuery.status = "available";
    }
    
    // Recupera gli item del venditore
    const items = await Item.find(itemsQuery)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    // Verifica se ci sono storie attive
    const now = new Date();
    const stories = await Story.find({
      author: sellerId,
      expiresAt: { $gt: now }
    }).countDocuments();
    
    response.status(200).json({
      seller,
      items,
      hasStories: stories > 0,
      storyCount: stories,
      isOwnStore // Include questa informazione nella risposta
    });
  } catch (error) {
    console.error("Errore nel recupero dei dettagli del negozio:", error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};



