import Post from '../models/post.js';
import Comment from '../models/comment.js';


// Controller per recuperare post pubblici - limitato al numero di post necessario per il layout (18)
export const getPublicPosts = async (req, res) => {
  try {
    // Recupera esattamente i post necessari per il layout (18 fissi, niente paginazione)
    const posts = await Post.find({})
      .populate('author', 'firstName lastName username profilePicture')
      .populate('comments')
      .lean({ virtuals: true }) // Questo è il fix principale!
      .sort({ createdAt: -1 })
      .limit(18);  // Numero fisso di post per riempire esattamente il layout
    
    // Log di sicurezza
    console.log(`✅ Forniti ${posts.length} post pubblici per la visualizzazione in homepage`);
    
    // Modifica questa parte nel controller pubblico
    const safePostsData = posts.map(post => {
      // Calcolo esplicito dei conteggi
      const likeCount = post.likes?.length || 0;
      const commentCount = post.comments?.length || 0;
      
      // Debug
      console.log(`Post ID ${post._id} → likes: ${likeCount}, comments: ${commentCount}`);
      
      return {
        _id: post._id,
        title: post.title,
        content: post.content, 
        cover: post.cover,
        author: {
          _id: post.author?._id || 'user-placeholder',
          firstName: post.author?.firstName || 'Utente',
          lastName: post.author?.lastName || 'Anonimo',
          username: post.author?.username || 'user_placeholder',
          profilePicture: post.author?.profilePicture || 'https://picsum.photos/seed/default/40/40'
        },
        createdAt: post.createdAt,
        likeCount: likeCount,  // Usa il conteggio calcolato manualmente
        commentCount: commentCount,  // Usa il conteggio calcolato manualmente
        media: post.media || [],
        hashtags: post.hashtags || []
      };
    });
    
    // Assicurati che ogni post abbia almeno un commento di prova
    const postsWithComments = safePostsData.map(post => {
      // Se il post non ha commenti, aggiungi un commento di prova
      if (!post.comments || post.comments.length === 0) {
        return {
          ...post,
          comments: [{
            _id: `demo-comment-${post._id}`,
            content: "Questo è un commento di esempio per testare la visualizzazione!",
            createdAt: new Date(),
            author: post.author // Usa lo stesso autore del post per semplicità
          }]
        };
      }
      return post;
    });
    
    // Invia i post con commenti di prova
    res.status(200).json({ posts: postsWithComments });
  } catch (error) {
    console.error('❌ Errore nel recupero dei post pubblici:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei post' });
  }
};


// Controller per recuperare commenti pubblici di un post
export const getPublicPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Recupera il post con i suoi commenti
    const post = await Post.findById(postId)
      .populate({
        path: 'comments',
        options: { 
          limit: 1, // Solo l'ultimo commento
          sort: { createdAt: -1 } 
        },
        populate: {
          path: 'author',
          select: 'firstName lastName username profilePicture'
        }
      })
      .lean();
    
    if (!post) {
      return res.status(404).json({ message: 'Post non trovato' });
    }
    
    // Assicurati che i commenti siano completi con tutti i campi
    const comments = post.comments || [];
    
    // Aggiungi log per debugging
    console.log(`Commenti trovati per post ${postId}: ${comments.length}`);
    if (comments.length > 0) {
      console.log(`Primo commento: ${JSON.stringify(comments[0])}`);
    }
    
    res.status(200).json({
      comments: comments,
      pagination: {
        total: comments.length,
        pages: 1,
        current: 1
      }
    });
  } catch (error) {
    console.error('❌ Errore nel recupero dei commenti pubblici:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei commenti' });
  }
};


// Controller per recuperare risposte ai commenti pubblici
export const getPublicCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    console.log(`🔍 Cercando risposte per il commento ${commentId}...`);
    
    // Trova tutti i commenti che hanno questo commentId come parentComment
    const replies = await Comment.find({ parentComment: commentId })
      .populate('author', 'firstName lastName username profilePicture')
      .sort({ createdAt: 1 })
      .lean();
    
    console.log(`✅ Trovate ${replies.length} risposte per il commento ${commentId}`);
    
    // Log dettagliato per debugging
    if (replies.length > 0) {
      console.log(`🔍 Prima risposta da: ${replies[0].author?.username || 'Unknown'}`);
      console.log(`🔍 Contenuto: "${replies[0].content.substring(0, 50)}${replies[0].content.length > 50 ? '...' : ''}"`);
    } else {
      console.log(`❕ Nessuna risposta trovata per il commento ${commentId}`);
    }
    
    res.status(200).json({
      replies: replies
    });
  } catch (error) {
    console.error('❌ Errore nel recupero delle risposte ai commenti:', error);
    console.error('Dettagli errore:', error.message);
    res.status(500).json({ message: 'Errore durante il recupero delle risposte ai commenti' });
  }
};