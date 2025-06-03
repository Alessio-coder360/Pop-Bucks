import Post from '../models/post.js'; // Importa il modello Post
import Comment from '../models/comment.js'; // Importa il modello Comment




// CONTROLLER : 



// TODO ---- ricerca post con filtri e paginazione: 

 export const getPosts = async (request,response) => {

    try {
            const {
            page = 1,         // Pagina corrente (default: 1)
            limit = 10,       // Numero di post per pagina (default: 10)
            category,         // Filtro per categoria (opzionale) 
            hashtag,          // Filtro per hashtag (opzionale)
            sortBy = "newest" // Come ordinare i risultati (default: più recenti) // da usare nel front
        } = request.query;


        // Converti page e limit in numeri
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
         
            // Calcola quanti risultati saltare
          const skip = (pageNum - 1) * limitNum;

        let conditions = {}; // Condizioni di ricerca iniziali
        // Se è specificata una categoria, aggiungiamo la condizione
        if( category) conditions.category = category;
        if( hashtag) conditions.hashtags = hashtag; // Se è specificato un hashtag, aggiungiamo la condizione

        // AGGIUNGI QUESTO: Escludi i video marcati come "solo reels"
        conditions.isReelsOnly = { $ne: true };

        // Definisci l'ordinamento
        const sortOptions = sortBy === "popular" // nella get del front end ricordati 
        ? { likeCount: -1 }    // Se "popular", ordina per numero di like (decrescente)
        : { createdAt: -1 };   // Altrimenti ordina per data (più recenti prima)
  
        // Esegui la query al database
           const posts = await Post.find(conditions) // ricorda se vuoto {} restituisce tutto 
           .sort(sortOptions)
           .skip(skip)
           .limit(limitNum)
           .populate({
             path: "author",
             select: "firstName lastName username profilePicture"
           })
           .lean({ virtuals: true });

        
         // Conta il numero totale di post che corrispondono ai filtri
        const total = await Post.countDocuments(conditions)        // Invia la risposta con i risultati e info sulla paginazione
        response.status(200).json({
          posts,
          totalPages: Math.ceil(total / limitNum),
          currentPage: pageNum,
          totalPosts: total
            })
    
                     } catch (error) {
              response.status(500).json({ message: "Errore nel server", error: error.message });
            }
                }





/**
 * GET /posts/user/:id
 * Recupera tutti i post di un utente specifico con paginazione
 * 
 * @param {Object} request - L'oggetto richiesta Express
 * @param {Object} response - L'oggetto risposta Express
 */
export const getUserPosts = async (request, response) => {
  try {
    const { id } = request.params; // ID dell'utente dai parametri URL
    
    const {
      page = 1,         // Pagina corrente (default: 1)
      limit = 10,       // Numero di post per pagina (default: 10)
      sortBy = "newest" // Come ordinare i risultati (default: più recenti)
    } = request.query;
    
    // Converti page e limit in numeri
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Calcola quanti risultati saltare
    const skip = (pageNum - 1) * limitNum;
    
    // Verifica parametri di paginazione
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return response.status(400).json({ 
        message: "Parametri di paginazione non validi"
      });
    }
    
    // Controlla se l'ID utente è valido
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return response.status(400).json({ 
        message: "ID utente non valido" 
      });
    }
    
    // Definisci l'ordinamento in base al parametro sortBy
    const sortOptions = sortBy === "popular" 
      ? { likeCount: -1, createdAt: -1 }    // Più popolari prima, poi più recenti
      : { createdAt: -1 };                  // Più recenti prima (default)
    
    // Esegui la query al database per contare il totale dei post
    const totalPosts = await Post.countDocuments({ author: id });
    
    // Se l'utente non ha post, restituisci un array vuoto
    if (totalPosts === 0) {
      return response.status(200).json({
        posts: [],
        pagination: {
          totalPages: 0,
          currentPage: pageNum,
          totalPosts: 0
        }
      });
    }
    
    // Esegui la query al database per recuperare i post con paginazione
    const posts = await Post.find({ author: id })
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: "author",
        select: "firstName lastName username profilePicture"
      })
      .lean({ virtuals: true });
    
    // Calcola il numero totale di pagine
    const totalPages = Math.ceil(totalPosts / limitNum);
    
    // Invia la risposta con i post e le informazioni di paginazione
    response.status(200).json({
      posts,
      pagination: {
        totalPages,
        currentPage: pageNum,
        totalPosts
      }
    });
    
  } catch (error) {
    console.error(`❌ Errore nel recupero dei post dell'utente: ${error.message}`);
    response.status(500).json({ 
      message: "Errore nel server", 
      error: error.message 
    });
  }
};










       
        // TODO --- GET SINGLE POST:

   export const getPostById = async (request, response) => {
          try {
              // Estraggo l'ID del post dalla richiesta
              const { id } = request.params;
              
              // Opzionalmente estraggo parametri per la paginazione dei commenti
              const { commentPage = 1, commentLimit = 5 } = request.query;
              
              // Converto in numeri e calcolo lo skip per i commenti
              const commentPageNum = parseInt(commentPage);
              const commentLimitNum = parseInt(commentLimit);
              const commentSkip = (commentPageNum - 1) * commentLimitNum;
              
              // Trovo il post e popolo i dati dell'autore e dei prodotti collegati
              const post = await Post.findById(id)
                  .populate("author", "firstName lastName username profilePicture")
                  .populate({
                      path: "linkedItems",
                      select: "name price images status",
                      match: { status: "available" } // Solo prodotti disponibili
                  })
                  .lean({ virtuals: true });
              
              // Verifico se il post esiste
              if (!post) {
                  return response.status(404).json({ message: "Post non trovato" });
              }
              
              // Trovo i commenti principali con paginazione
              const comments = await Comment.find({ 
                  post: id,
                  parentComment: null // Solo commenti principali (non risposte)
              })
              .sort({ createdAt: -1 }) // Dal più recente
              .skip(commentSkip)
              .limit(commentLimitNum)
              .populate("author", "firstName lastName username profilePicture")
              .lean();
              
              // Per ogni commento principale, trovo le prime rispo
              // Promise All: 1) Inizia a caricare le risposte per TUTTI i commenti contemporaneamente, 2)Aspetta che TUTTE le operazioni siano completate, 3) Continua con i risultati:
              const commentsWithReplies = await Promise.all(comments.map(async comment => ({
                ...comment,
                replies: await Comment.find({ parentComment: comment._id })
                    .sort({ createdAt: 1 })
                    .limit(3)
                    .populate("author", "firstName lastName username profilePicture")
                    .lean()
            })));
            // Il valore del map viene restituito automaticamente (return implicito) grazie alle parentesi ({})
              
              // Conto il totale dei commenti principali per la paginazione:
              // 
              const totalComments = await Comment.countDocuments({ 
                  post: id,   // Filtra i commenti associati a questo post
                  parentComment: null  // Filtra solo i commenti principali (non le risposte)
          })
              // countDocuments() è un metodo di Mongoose che conta quanti documenti soddisfano i criteri specificati
              // { post: id } specifica che vogliamo contare solo i commenti relativi al post corrente
              // countDocuments() accetta un singolo parametro: un oggetto di filtro (query):
              //await Model.countDocuments({ campo1: valore1, campo2: valore2 });
              
              // Incremento il contatore delle visualizzazioni
              // await Post.findByIdAndUpdate(id, { $inc: { views: 1 } });
              
              // Invio la risposta completa
              response.status(200).json({
                  post,
                  comments: commentsWithReplies,
                  commentPagination: {
                      totalPages: Math.ceil(totalComments / commentLimitNum),
                      currentPage: commentPageNum,
                      totalComments
                  }
              });
              
          } catch (error) {
              console.error("Errore nel recupero del post:", error);
              response.status(500).json({ message: "Errore nel server", error: error.message });
          }
      } 





// TODO ---- POST: Crea un nuovo post:

export const createPost = async (request, response) => {
  try {
    const { title, content, category, hashtags } = request.body;
    
    // Prendi l'ID dell'autore dall'utente autenticato
    const author = request.user.id;  // Estrai l'ID dell'autore dall'utente autenticato
                                     // Usiamo "author" perché nei post l'utente agisce come creatore di contenuti
                                   // Questo nome corrisponde al campo nello schema Post e riflette il ruolo creativo dell'utente
  
    
    // Qui request.file è disponibile perché Multer ha modificato l'oggetto request originale

    if (!request.file) {
      return response.status(400).json({ message: "Cover image richiesta" });
    }
    
    // Estrai l'URL dell'immagine dal file caricato
    const cover = request.file.path;
    
    // Aggiungi un readTime di default (richiesto dallo schema)
    const readTime = {
      value: 5, // Valore di default
      unit: "minutes"
    };
    
    // Crea un nuovo post con tutti i dati necessari
    const newPost = new Post({ title, content, category, hashtags, cover, author, readTime });
    await newPost.save();
    
    response.status(201).json(newPost);
  } catch (error) {
    console.error("Errore durante la creazione del post:", error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};




 // Crea un nuovo post con video

 
export const createVideo = async (request, response) => {
  try {
    console.log("📥 Richiesta video ricevuta");
    console.log("📦 Body:", request.body);
    console.log("🗂️ File:", request.file);
    
    // Controllo esistenza del file
    if (!request.file) {
      console.error("❌ FILE MANCANTE nella richiesta");
      return response.status(400).json({ message: "Video richiesto" });
    }
    
    const { title, content, category, hashtags, isReelsOnly } = request.body;
    
    // Verifica se il file ha già una thumbnail generata da Cloudinary
    let coverUrl = null;
    
    if (request.file.path) {
      // Se è un video Cloudinary, genera l'URL della cover derivandola dal path del video
      // La convenzione di Cloudinary è: cambia l'estensione del file con .jpg e aggiungi /thumbnail
      const videoPath = request.file.path;
      
      if (videoPath.includes('cloudinary.com')) {
        // Estrai la parte di base dell'URL Cloudinary
        const baseUrlMatch = videoPath.match(/(.*\/v\d+\/.*?)\.[^.]+$/);
        if (baseUrlMatch && baseUrlMatch[1]) {
          // Crea l'URL della thumbnail
          coverUrl = `${baseUrlMatch[1]}.jpg`;
        }
      }
    }
    
    // Crea nuovo documento post
    const newVideo = new Post({
      title: title || 'Video senza titolo',
      content: content || '',
      author: request.user._id,
      category: category || 'video',
      hashtags: hashtags ? hashtags.split(',').map(tag => tag.trim()) : [],
      media: [{
        url: request.file.path,
        type: 'video',
        public_id: request.file.filename || request.file.public_id
      }],
      cover: coverUrl || request.file.path || null,
      isReelsOnly: isReelsOnly === 'true' || isReelsOnly === true || false,
    });
    
    // Salva il nuovo video nel database
    await newVideo.save();
    
    // Popola l'autore per restituire dati completi
    await newVideo.populate('author', 'firstName lastName username profilePicture');
    
    response.status(201).json({
      success: true,
      message: 'Video caricato con successo',
      post: newVideo
    });
    
  } catch (error) {
    console.error("❌ Errore nella creazione del video:", error);
    response.status(500).json({ 
      message: "Errore nella creazione del video", 
      error: error.message 
    });
  }
};

/**
 * GET /posts/user/:id/videos
 * Recupera tutti i video di un utente specifico con paginazione
 * 
 * @param {Object} request - L'oggetto richiesta Express
 * @param {Object} response - L'oggetto risposta Express
 */
export const getUserVideos = async (request, response) => {
  try {
    const { id } = request.params; // ID dell'utente dai parametri URL
    
    const {
      page = 1,         // Pagina corrente (default: 1)
      limit = 10,       // Numero di video per pagina (default: 10)
      sortBy = "newest" // Come ordinare i risultati (default: più recenti)
    } = request.query;
    
    // Converti page e limit in numeri
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Calcola quanti risultati saltare
    const skip = (pageNum - 1) * limitNum;
    
    // Verifica parametri di paginazione
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return response.status(400).json({ 
        message: "Parametri di paginazione non validi"
      });
    }
    
    // Controlla se l'ID utente è valido
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return response.status(400).json({ 
        message: "ID utente non valido" 
      });
    }
    
    // Definisci l'ordinamento in base al parametro sortBy
    const sortOptions = sortBy === "popular" 
      ? { likeCount: -1, createdAt: -1 }  // Più popolari prima, poi più recenti
      : { createdAt: -1 };                // Più recenti prima (default)
    
    // Filtro per trovare solo i post con media di tipo video
    const videoFilter = {
      author: id,
      'media.type': 'video'  // Filtra solo i post con media di tipo video
    };
    
    // Esegui la query al database per contare il totale dei video
    const totalVideos = await Post.countDocuments(videoFilter);
    
    // Se l'utente non ha video, restituisci un array vuoto
    if (totalVideos === 0) {
      return response.status(200).json({
        posts: [],
        pagination: {
          totalPages: 0,
          currentPage: pageNum,
          totalPosts: 0
        }
      });
    }
    
    // Esegui la query al database per recuperare i video con paginazione
    const videos = await Post.find(videoFilter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: "author",
        select: "firstName lastName username profilePicture"
      })
      .lean({ virtuals: true });
    
    // Calcola il numero totale di pagine
    const totalPages = Math.ceil(totalVideos / limitNum);
    
    // Invia la risposta con i video e le informazioni di paginazione
    response.status(200).json({
      posts: videos,
      pagination: {
        totalPages,
        currentPage: pageNum,
        totalPosts: totalVideos
      }
    });
    
  } catch (error) {
    console.error(`❌ Errore nel recupero dei video dell'utente: ${error.message}`);
    response.status(500).json({ 
      message: "Errore nel server", 
      error: error.message 
    });
  }
};


// Aggiungi questa funzione al fondo del file
export const getTrendingVideos = async (request, response) => {
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Cerca i post che hanno media di tipo video
    const posts = await Post.find({ 
      'media.type': 'video' 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'firstName lastName username profilePicture')
    .lean({ virtuals: true });
    
    // Calcola il conteggio totale
    const total = await Post.countDocuments({ 'media.type': 'video' });
    
    response.status(200).json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
    
  } catch (error) {
    console.error("Errore nel recupero video trending:", error);
    response.status(500).json({ message: "Errore nel recupero dei video", error: error.message });
  }
};

// TODO ---- PUT aggiorna o modifica il post. 

export const updatePost = async (request, response) => {
  try {
    // Estrai ID del post dai parametri URL
    const { id } = request.params;
    
    // Estrai i dati dal corpo della richiesta
    const { title, content, category, hashtags } = request.body;
    
    // Usa il post già verificato dal middleware isPostAuthor
    const post = request.post;
    
    // Se stai usando il middleware isPostAuthor, questo controllo è già fatto lì
    // ma lo teniamo per sicurezza
    if (!post) {
      return response.status(404).json({ message: "Post non trovato" });
    }
    
    // Prepara l'oggetto di aggiornamento con i campi forniti
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (hashtags) updateData.hashtags = hashtags;
    
    // Se è stato caricato un file, aggiorna anche la copertina
    if (request.file) {
      updateData.cover = request.file.path;
    }

    // Verifica se ci sono dati da aggiornare
    if (Object.keys(updateData).length === 0) {
      return response.status(400).json({ message: "Nessuna modifica da applicare" });
    }
    
    // Aggiorna il post
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean({ virtuals: true });
    
    // Invia la risposta
    response.status(200).json({
      post: updatedPost,
      message: "Post aggiornato con successo"
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento del post:", error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};


// TODO ---- Aggiorna la cover del post

export const updatePostCover = async (request, response) => {
  try {
    const { id } = request.params;
    
    // Trova il post originale
    const post = request.post;
    if (!post) {
      return response.status(404).json({ message: "Post non trovato" });
    }
    
    // Verifica che sia stato caricato un file
    if (!request.file) {
      return response.status(400).json({ message: "Nessuna immagine caricata" });
    }
    
    // Aggiorna solo la copertina
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { cover: request.file.path },
      { new: true, runValidators: true }
    ).lean({ virtuals: true });
    
    response.status(200).json({
      post: updatedPost,
      message: "Copertina aggiornata con successo"
    });
  } catch (error) {
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};

// TODO --- Controller for Addlikes to a post: 

export const likePost = async (request, response) => {
  try{
      const postId = request.params.id  // è necessario per identificare il post a cui aggiungere il like (viene dalla URL)
       const author = request.user.id; //  è necessario per identificare quale utente sta mettendo like (viene dal middleware di autenticazione)

   
      // Aggiungi l'ID dell'utente all'array dei like
      const updatedPost = await Post.findByIdAndUpdate(
          postId,
          { $push : {likes: author}}, // Aggiungi l'ID dell'utente alla lista dei like
          { new: true}
      )
      .lean({ virtuals: true });
response.status(200).json({ message: "Post liked successfully",
  likeCount: updatedPost.likeCount, // Restituisci il conteggio dei like

   // senza la funzione virtual: 
  // likeCount: updatedPost.likes.length, // Restituisci il conteggio dei like

  post: updatedPost // Restituisci il post aggiornato
  // Non è strettamente necessario restituire tutto il post aggiornato - potresti restituire solo il conteggio dei like.
  //  Ma fornire il post completo dà al frontend più flessibilità (può aggiornare altri campi oltre ai like).
  })
}
catch(error){
  console.log(error)
  response.status(500).json({message: "Errore nel server", error : error.message})
}
}

// TODO --- Controller for UNlikes to a post: 

export const unlikePost = async (request, response) => {
  try {
    const author = request.user.id;
    const postId = request.params.id;
    
    // Verifica se il post esiste e se l'utente ha già messo like
    const post = await Post.findById(postId);
    if (!post) {
      return response.status(404).json({ message: "Post non trovato" });
    }
    
    // Verifica se l'utente ha messo like
    if (!post.likes.includes(author)) {
      return response.status(400).json({ message: "Non hai messo like a questo post" });
    }
    
    // Rimuovi l'ID dell'utente dall'array dei like
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: author } },
      { new: true }
    ).lean({ virtuals: true });
    
    response.status(200).json({
      message: "Post unliked successfully",
      likeCount: updatedPost.likeCount,
      post: updatedPost
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};

// Correzione nel controller postController.js
export const getPostLikes = async (req, res) => {
  try {
    // Cambia da postId a id per corrispondere alla route
    const { id } = req.params;
    
    const post = await Post.findById(id)
      .populate('likes', 'firstName lastName username profilePicture')
      .lean();
    
    if (!post) {
      return res.status(404).json({ message: 'Post non trovato' });
    }
    
    res.status(200).json({
      users: post.likes || []
    });
  } catch (error) {
    console.error('❌ Errore nel recupero dei likes:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei likes' });
  }
};

// TODO ----  ELIMINA IL POST: 

export const deletePost = async (request, response) => {
  try {
    const { id } = request.params;
    
    // Usa il post già verificato dal middleware isPostAuthor
    const post = request.post;
    
    if (!post) {
      return response.status(404).json({ message: "Post non trovato" });
    }
    
    // Elimina il post
    await Post.findByIdAndDelete(id);
    
    // Risposta di successo
    return response.status(200).json({ message: "Post eliminato con successo" });
  } catch(error) {
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};




// TODO ---- GET PER RICEVERE TUTTI I COMMENTI DEL POST:

export const getPostComments = async (request, response) => {
  try {
    const {id} = request.params;
    const { page = 1, limit = 10, includeReplies = false, commentId } = request.query; 

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const postExist = await Post.findById(id);
    if(!postExist) return response.status(404).json({message: "Post non trovato"});

    let replies = [];
    if(commentId){
       replies = await Comment.find({ parentComment: commentId })
        .sort({ createdAt: 1 })
        .populate("author", "firstName lastName username profilePicture")
        .lean();
    }

    if (request.query.onlyReplies === 'true') {
      return response.status(200).json({ replies });
    }

    // NOTA: Ho rimosso la parentesi graffa in eccesso che chiudeva prematuramente il blocco try
    
    // Recupera i commenti principali con paginazione
    const comments = await Comment.find({post: id, parentComment: null})
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limitNum)
      .populate("author", "firstName lastName username profilePicture")
      .lean({ virtuals: true });

    // Se il client richiede le risposte, le include nella risposta
    let commentsResult = comments;
    if (includeReplies === 'true') {
      console.log("🔄 Includendo le risposte ai commenti...");
      commentsResult = await Promise.all(comments.map(async comment => ({
        ...comment,
        replies: await Comment.find({ parentComment: comment._id })
          .sort({ createdAt: 1 })
          .populate("author", "firstName lastName username profilePicture")
          .lean()
      })));
    }

    const total = await Comment.countDocuments({post: id, parentComment: null});
    
    response.status(200).json({
      comments: commentsResult,
      replies: replies,
      pagination:{
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        totalComments: total
      }
    });
  } catch(error){
    console.error("Errore nel recupero dei commenti:", error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};


// TODO ---- Aggiungi un commento a un post:

export const addComment = async (request, response) => {
  try {
    const {id} = request.params; // id del post a cui stai aggiungendo il commento (presente nell'URL)
    const author = request.user.id; // proviene dal authMiddleware 
    const {content, parentComment} = request.body;

    // Verifica che il contenuto non sia vuoto
    if (!content || content.trim() === '') {
      return response.status(400).json({ message: "Il contenuto del commento è obbligatorio" });
    }

    // Verifica che il post esista - PROTEZIONE CONTRO ATTACCHI
    const postExists = await Post.findById(id);
    if (!postExists) {
      return response.status(404).json({ message: "Post non trovato" });
    }

    // Se è specificato un parentComment, verifica che esista
    if (parentComment) {
      const parentCommentExists = await Comment.findById(parentComment);
      if (!parentCommentExists) {
        return response.status(404).json({ message: "Commento padre non trovato" });
      }
      // Verifica che il commento padre appartenga allo stesso post
      if (parentCommentExists.post.toString() !== id) {
        return response.status(400).json({ message: "Il commento padre appartiene a un altro post" });
      }
    }

    // Crea il nuovo commento
    const newComment = await Comment.create({
      post: id,
      author,
      content,
      parentComment // IL COMMENTO(RISPOSTA) AD UN COMMENTO SUL POST 
    });

    // Se è un commento principale (non una risposta), aggiorna l'array comments del post
    if (!parentComment) {
      await Post.findByIdAndUpdate(id, {
        $push: { comments: newComment._id }
      });
    }
    
    // Popola i dati dell'autore prima di rispondere
    const populatedComment = await Comment.findById(newComment._id)
      .populate("author", "firstName lastName username profilePicture")
      .lean();
    
    response.status(201).json({
      comment: populatedComment,
      message: "Commento aggiunto con successo"
    });
  } catch (error) {
    console.error("Errore nell'aggiunta del commento:", error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};


// TODO AGGIORNA COMMENTO


export const updateComment = async (request, response) => {
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
    
    // Prepara l'oggetto di aggiornamento
    const updateData = {};
    if (content) updateData.content = content;
    
    
    // Verifica se ci sono dati da aggiornare
    if (Object.keys(updateData).length === 0) {
      return response.status(400).json({ message: "Nessuna modifica da applicare" });
    }

    // Aggiorna solo il contenuto
    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      updateData,
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

// Controller per eliminare un commento
export const deleteComment = async (request, response) => {
  try {
    const { id } = request.params; // ID del commento
    const userId = request.user.id;
    
    // Verifica che il commento esista
    const comment = await Comment.findById(id);
    if (!comment) {
      return response.status(404).json({ message: "Commento non trovato" });
    }
    
    // Verifica che l'utente sia l'autore del commento
    if (comment.author.toString() !== userId) {
      return response.status(403).json({ message: "Non sei autorizzato a eliminare questo commento" });
    }
    
    // Se è un commento principale, rimuovi il riferimento dal post
    if (!comment.parentComment) {
      await Post.findByIdAndUpdate(comment.post, {
        $pull: { comments: id }
      });
    }
    
    // Elimina le risposte al commento se ne ha
    await Comment.deleteMany({ parentComment: id });
    
    // Elimina il commento
    await Comment.findByIdAndDelete(id);
    
    response.status(200).json({
      message: "Commento eliminato con successo"
    });
  } catch (error) {
    console.error("Errore nell'eliminazione del commento:", error);
    response.status(500).json({ message: "Errore nel server", error: error.message });
  }
};

//controller per i like ai commenti
export const likeComment = async (request, response) => {
  try {
    const { id } = request.params; // ID del commento
    const userId = request.user.id;
    
    // Verifica che il commento esista
    const comment = await Comment.findById(id);
    if (!comment) {
      return response.status(404).json({ message: "Commento non trovato" });
    }
    
    // Verifica se l'utente ha già messo like
    if (comment.likes.includes(userId)) {
      return response.status(400).json({ message: "Hai già messo like a questo commento" });
    }
    
    // Aggiungi il like
    comment.likes.push(userId);
    await comment.save();
    
    response.status(200).json({
      message: "Like aggiunto al commento",
      likeCount: comment.likes.length
    });
  } catch (error) {
    console.error("Errore nell'aggiungere il like:", error);
    response.status(500).json({ message: "Errore nel server" });
  }
};

export const unlikeComment = async (request, response) => {
  try {
    const { id } = request.params; // ID del commento
    const userId = request.user.id;
    
    // Verifica che il commento esista
    const comment = await Comment.findById(id);
    if (!comment) {
      return response.status(404).json({ message: "Commento non trovato" });
    }
    
    // Verifica se l'utente ha messo like
    if (!comment.likes.includes(userId)) {
      return response.status(400).json({ message: "Non hai messo like a questo commento" });
    }
    
    // Rimuovi il like
    comment.likes = comment.likes.filter(id => id.toString() !== userId);
    await comment.save();
    
    response.status(200).json({
      message: "Like rimosso dal commento",
      likeCount: comment.likes.length
    });
  } catch (error) {
    console.error("Errore nel rimuovere il like:", error);
    response.status(500).json({ message: "Errore nel server" });
  }
};

// Nel controller for the views: 

// crea lo schema se c'è tempo

// export const viewPost = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const userId = req.user?.id || req.ip; // Usa user ID se disponibile, altrimenti IP
      
//       // Controlla se questo utente ha già visualizzato il post recentemente
//       const hasViewed = await PostView.findOne({
//         post: id,
//         viewer: userId,
//         viewedAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Ultime 24 ore
//       });
      
//       if (!hasViewed) {
//         // Incrementa il contatore solo se l'utente non ha visualizzato recentemente
//         await Post.findByIdAndUpdate(id, { $inc: { views: 1 } });
        
//         // Registra questa visualizzazione
//         await PostView.create({
//           post: id,
//           viewer: userId,
//           viewedAt: new Date()
//         });
//       }
      
//       res.status(200).json({ success: true });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   };

