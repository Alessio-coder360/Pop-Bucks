




  // ! ottenere un prodotto  con dettraglio completi : 

  // Questa funzione carica un prodotto con tutti i suoi dettagli
// Include anche prodotti simili e post correlati
export const getItemById = async (req, res) => {
    try {
      const itemId = req.params.id;
      
      // Carichiamo il prodotto con tutte le sue informazioni
      const item = await Item.findById(itemId)
        .populate({
          path: "seller",
          select: "firstName lastName username profilePicture sellerRating location"
        })
        .populate({
          path: "relatedPost",
          select: "title content media"
        })
        .lean();
        
      // Se il prodotto non esiste, rispondiamo con un errore
      if (!item) {
        return res.status(404).json({ message: "Prodotto non trovato" });
      }
      
      // Incrementiamo il contatore delle visualizzazioni
      await Item.findByIdAndUpdate(itemId, { $inc: { views: 1 } });
      
      // Troviamo prodotti simili (stessa categoria, ma non lo stesso prodotto)
      const similarItems = await Item.find({
          category: item.category,
          _id: { $ne: itemId },  // $ne = not equal (diverso da)
          status: "available"
        })
        .sort({ createdAt: -1 })  // Dal più recente
        .limit(4)                 // Solo 4 prodotti simili
        .select("name price.amount price.currency images")
        .lean();
        
      // Come sopra, per ogni prodotto simile troviamo l'immagine principale
      const similarItemsWithImages = similarItems.map(item => {
        const primaryImage = item.images.find(img => img.isPrimary);
        const mainImageUrl = primaryImage 
          ? primaryImage.url 
          : (item.images[0]?.url || "default-product.jpg");
        return { ...item, mainImageUrl };
      });
      
      // Troviamo altri post che hanno taggato questo prodotto
      const relatedPosts = await Post.find({
          linkedItems: itemId
        })
        .sort({ createdAt: -1 })
        .limit(3)
        .select("title cover author createdAt")
        .populate({
          path: "author",
          select: "username profilePicture"
        })
        .lean();
        
      // Inviamo tutto insieme
      res.status(200).json({
        item,
        similarItems: similarItemsWithImages,
        relatedPosts
      });
      
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };


  // # query per le storie 

  // ! ottenere storie recenti 


  // Questa funzione carica le storie attive degli utenti che segui
// Mostra solo le storie non ancora scadute (meno di 24 ore)
export const getRecentStories = async (req, res) => {
    try {
      // Otteniamo l'ID dell'utente dalla richiesta (deve essere autenticato)
      const userId = req.user.id;
      
      // Troviamo l'utente con la lista di chi segue
      const currentUser = await User.findById(userId).select("following");
      
      if (!currentUser) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      
      // Prepariamo la lista di utenti di cui vogliamo vedere le storie
      // Include chi segui + te stesso
      const userIds = [
        ...currentUser.following, // Utenti che segui
        userId                    // Te stesso
      ];
      
      // Troviamo le storie non scadute di questi utenti
      // Una storia è "non scaduta" se expiresAt è maggiore di adesso
      const stories = await Story.find({
          author: { $in: userIds },     // $in = in questo array
          expiresAt: { $gt: new Date() } // $gt = greater than (maggiore di)
        })
        .sort({ createdAt: -1 })        // Più recenti prima
        .populate({
          path: "author",
          select: "firstName lastName username profilePicture"
        })
        .populate({
          path: "linkedItem",
          select: "name price.amount price.currency images"
        })
        .lean();
        
      // Raggruppiamo le storie per utente
      // Questo ci permette di mostrare facilmente "tutte le storie di Mario", ecc.
      const storiesByUser = stories.reduce((acc, story) => {
        // Se l'utente non è ancora nell'accumulatore, lo aggiungiamo
        if (!acc[story.author._id]) {
          acc[story.author._id] = {
            user: {
              _id: story.author._id,
              firstName: story.author.firstName,
              lastName: story.author.lastName,
              username: story.author.username,
              profilePicture: story.author.profilePicture
            },
            stories: [] // Lista vuota all'inizio
          };
        }
        
        // Aggiungiamo la storia all'utente corrispondente
        acc[story.author._id].stories.push(story);
        
        return acc;
      }, {});
      
      // Convertiamo l'oggetto in un array di utenti con le loro storie
      const result = Object.values(storiesByUser);
      
      // Inviamo il risultato
      res.status(200).json(result);
      
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };



  // # Query per chat e messaggi : 

  // ! Ottenere conversazioni dell'utente: 

  // Questa funzione carica tutte le conversazioni dell'utente
// Mostra anche l'ultimo messaggio di ciascuna conversazione
export const getUserConversations = async (req, res) => {
    try {
      // Otteniamo l'ID dell'utente (deve essere autenticato)
      const userId = req.user.id;
      
      // Troviamo le conversazioni dove l'utente è un partecipante
      // e che sono attive
      const conversations = await Conversation.find({
          participants: userId,
          isActive: true
        })
        .populate({
          // Popola l'ultimo messaggio di ogni conversazione
          path: 'lastMessage',
          select: 'content createdAt sender readBy'
        })
        .populate({
          // Popola gli altri partecipanti (non l'utente corrente)
          path: 'participants',
          select: 'firstName lastName username profilePicture',
          match: { _id: { $ne: userId } } // $ne = not equal (diverso da)
        })
        .populate({
          // Se la conversazione riguarda un prodotto, caricalo
          path: 'item',
          select: 'name price.amount price.currency images'
        })
        .sort({ updatedAt: -1 }) // Ordina per ultima attività
        .lean();
      
      // Per ogni conversazione, controlliamo se l'ultimo messaggio è stato letto
      const conversationsWithReadStatus = conversations.map(conv => {
        // Se non c'è un ultimo messaggio, restituisci la conversazione com'è
        if (!conv.lastMessage) return conv;
        
        // Controlla se l'ultimo messaggio è stato inviato dall'utente corrente
        const sentByMe = conv.lastMessage.sender.toString() === userId;
        
        // Se il messaggio è stato inviato da altri, controlla se l'utente corrente l'ha letto
        const isUnread = !sentByMe && !conv.lastMessage.readBy.some(
          read => read.user.toString() === userId
        );
        
        // Aggiungi lo stato di lettura alla conversazione
        return { ...conv, isUnread };
      });
      
      // Inviamo il risultato
      res.status(200).json(conversationsWithReadStatus);
      
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // !Ottenere messaggi di una conversazione con paginazione 


  // Questa funzione carica i messaggi di una conversazione
// Li carica a blocchi (paginazione) per essere velocissima
export const getConversationMessages = async (req, res) => {
    try {
      // Otteniamo l'ID della conversazione e l'ID utente
      const { conversationId } = req.params;
      const userId = req.user.id;
      
      // Parametri di paginazione (dall'ultimo messaggio indietro)
      const { before, limit = 20 } = req.query;
      
      // Verifica che l'utente faccia parte della conversazione
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      });
      
      if (!conversation) {
        return res.status(403).json({ message: "Non autorizzato" });
      }
      
      // Prepariamo le condizioni di ricerca
      let conditions = { conversation: conversationId };
      
      // Se 'before' è specificato, prendiamo messaggi più vecchi di quella data
      if (before) {
        conditions.createdAt = { $lt: new Date(before) };
      }
      
      // Troviamo i messaggi
      const messages = await Message.find(conditions)
        .sort({ createdAt: -1 }) // Dal più recente al più vecchio
        .limit(Number(limit))
        .populate('sender', 'firstName lastName username profilePicture')
        .lean();
      
      // Invertiamo l'ordine per mostrarli dal più vecchio al più recente
      const orderedMessages = messages.reverse();
      
      // Segna i messaggi come letti (solo quelli non inviati dall'utente)
      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: userId },           // Non inviati dall'utente corrente
          'readBy.user': { $ne: userId }     // Non già segnati come letti
        },
        {
          $push: { readBy: { user: userId } } // Aggiungi l'utente ai lettori
        }
      );
      
      // Inviamo i messaggi
      res.status(200).json({
        messages: orderedMessages,
        hasMore: messages.length === Number(limit) // Se abbiamo caricato esattamente 'limit' messaggi, probabilmente ce ne sono altri
      });
      
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };




