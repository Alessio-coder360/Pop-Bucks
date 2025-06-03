import React, { useState, useCallback, useEffect } from 'react';
import { Button, Form, Image, Modal } from 'react-bootstrap';
import { getPostComments, getCommentReplies, addReply } from '../api/PostAPI';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Aggiungi questo import

// Aggiungi queste costanti all'inizio per i colori
const tumblrBlue = '#001935';
const darkBlue = '#001224';
const deepPurple = '#3a1657';

// Aggiungi questa funzione che manca:
const formatDate = (date) => {
  if (!date) return "";
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  
  return d.toLocaleDateString();
};

// Aggiungi questa variabile per mantenere la cache globalmente
const commentCache = {};

// ! CONTROLLARE LA LOGICA DI APPARIZIONE DEI COMMENTI, QUI E STATO MODIFICATO PER LA HOME PAGE IN LOGOUT PER FAR APPARIRE SOLO L'ULTIMO

/**
 * Recupera l'URL corretto dell'immagine profilo, gestendo percorsi relativi e fallback
 */
const getProfileImageUrl = (author) => {
  if (!author) return 'https://i.pravatar.cc/40?img=1';
  if (!author.profilePicture) return `https://i.pravatar.cc/40?img=${author.username?.charCodeAt(0) % 70 || 1}`;
  
  // Se l'URL inizia con /uploads/ aggiungi il base URL
  if (author.profilePicture.startsWith('/uploads/')) {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${author.profilePicture}`;
  }
  
  return author.profilePicture;
}

export default function CommentsSection({ postId, initialComments = [] }) {
  const { isLoggedIn, currentUser, openRegistrationForm } = useAuth();
  const navigate = useNavigate(); // Usa il navigate di React Router
  const [comments, setComments] = useState(initialComments);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [page, setPage] = useState(1);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [displayCommentCount, setDisplayCommentCount] = useState(3);
  const [loadingReplies, setLoadingReplies] = useState({});
  const [commentReplies, setCommentReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null); // ID del commento a cui si sta rispondendo
  const [replyContent, setReplyContent] = useState(''); // Contenuto della risposta
  const [expandedReplies, setExpandedReplies] = useState({}); // Traccia quali commenti hanno risposte visibili
  const [loadedCommentIds, setLoadedCommentIds] = useState([]); // Stato per tracciare gli ID già caricati
  
  // Manteniamo hasMore ma commentato per uso futuro
  // eslint-disable-next-line no-unused-vars
  const [hasMore, setHasMore] = useState(true);

  // Aggiungi questo all'inizio del componente


  // Definisci loadComments con useCallback PRIMA dell'useEffect
  const loadComments = useCallback(async (resetComments = false) => {
    // Verifica se è un post di esempio
    const isSamplePost = postId && postId.startsWith('sample-');
    
    // Non fare richieste API per post di esempio o placeholder
    if (loading || !postId || postId === 'placeholder-id' || isSamplePost) {
      
      // Per i post di esempio, genera commenti fittizi
      if (isSamplePost) {
        setComments([
          {
            _id: `sample-comment-${Date.now()}`,
            content: "Questo è un commento di esempio. I commenti reali appariranno quando visualizzi post dal database.",
            createdAt: new Date().toISOString(),
            author: {
              firstName: "Utente",
              lastName: "Esempio",
              profilePicture: "https://via.placeholder.com/40"
            }
          }
        ]);
      }
      return;
    }
    
    setLoading(true);
    try {
      const data = await getPostComments(postId, resetComments ? 1 : page);
      
      // Controllo aggiuntivo per verificare che i commenti abbiano contenuto
      const validComments = data.comments?.filter(comment => 
        comment && comment.content && comment.author
      ) || [];
      
      
   
      
      if (resetComments) {
        setComments(validComments);
        setPage(2);
      } else {
        setComments(prev => [...prev, ...validComments]);
        setPage(prev => prev + 1);
      }
      
      // Manteniamo questa funzionalità per uso futuro
      setHasMore(data.pagination?.current < data.pagination?.pages);
    } catch (error) {
      console.error("Errore nel caricamento dei commenti:", error);
    } finally {
      setLoading(false);
    }
  }, [postId, page, loading]); // Dipendenze di useCallback

  // Modifica la funzione loadReplies per aggiungere log più dettagliati
  const loadReplies = async (commentId) => {
    if (loadingReplies[commentId] || commentReplies[commentId]) return;
    
    setLoadingReplies(prev => ({...prev, [commentId]: true}));
    
    try {
      const result = await getCommentReplies(commentId);
      
      if (result && result.replies) {
        setCommentReplies(prev => ({
          ...prev, 
          [commentId]: result.replies
        }));
      } else {
        console.log(`⚠️ Nessuna risposta trovata per il commento ${commentId}`);
      }
    } catch (error) {
      console.error(`❌ Errore nel caricamento delle risposte per il commento ${commentId}:`, error);
    } finally {
      setLoadingReplies(prev => ({...prev, [commentId]: false}));
    }
  };

  const handleAddReply = async (commentId) => {
    if (!replyContent.trim()) return;
    
    try {
      const result = await addReply(postId, commentId, replyContent);
      
      // Aggiungi la nuova risposta alla lista di risposte del commento
      setCommentReplies(prev => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), result.comment]
      }));
      
      // Mostra le risposte se non sono già visibili
      setExpandedReplies(prev => ({
        ...prev,
        [commentId]: true
      }));
      
      // Reset
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error("Errore nell'aggiunta della risposta:", error);
    }
  };

  // Modifica useEffect per fermare i caricamenti infiniti
  useEffect(() => {
    // Skip caricamento se l'ID è invalido
    if (!postId || postId === 'placeholder-id') return;
    
    // Se commenti già caricati, non ricaricare
    if (commentCache[postId]) {
      setComments(commentCache[postId]);
      return;
    }
    
    const fetchComments = async () => {
      try {
        const data = await getPostComments(postId);
        // Salva in cache locale
        commentCache[postId] = data.comments || [];
        setComments(data.comments || []);
      } catch (error) {
        console.error("❌ Errore caricamento commenti:", error);
      }
    };

    // Carica commenti solo una volta per postId
    fetchComments();
  }, [postId]); // ✅ Dipendenze corrette

  const handleNewComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isLoggedIn) return;
    
    try {
      // Implementare l'aggiunta del commento
      // ...
      
      // Reset dell'input
      setNewComment('');
      // Ricarica i commenti per vedere il nuovo
      loadComments(true);
    } catch (error) {
      console.error("Errore nell'invio del commento:", error);
    }
  };

  // Modifica la funzione handleLikeComment
  const handleLikeComment = (commentId) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    // Versione semplificata che aggiorna solo l'UI
    setComments(prevComments => 
      prevComments.map(c => {
        if (c._id === commentId) {
          // Toggle like
          const liked = c.userHasLiked || false;
          const newLikes = [...(c.likes || [])];
          
          if (!liked) {
            // Aggiungi like
            newLikes.push('temp-like-id');
          } else {
            // Rimuovi like
            newLikes.pop();
          }
          
          return {
            ...c,
            userHasLiked: !liked,
            likes: newLikes
          };
        }
        return c;
      })
    );
    
  };

  const toggleComments = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Modifica la funzione renderComments per mostrare le risposte
  const renderComments = (comment, index) => {
    return (
      <div key={index} className="comment-thread mb-3">
        {/* Commento principale - mantieni questa parte come è */}
        <div className="d-flex align-items-start mb-2">
          <Image 
            src={getProfileImageUrl(comment.author)}
            roundedCircle 
            width={32}
            height={32}
            className="me-2"
          />
          <div className="rounded p-2 flex-grow-1" style={{backgroundColor: 'rgb(0, 18, 36)', border: '1px solid #001224'}}>
            <div className="d-flex justify-content-between align-items-center">
              <span className="small fw-bold text-white">
                {comment.author?.firstName || ''} {comment.author?.lastName || ''}
              </span>
              <small className="text-white opacity-75">
                {formatDate(comment.createdAt)}
              </small>
            </div>
            <p className="small mb-0 text-white">{comment.content || "Nessun contenuto disponibile"}</p>
            
            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-white">
                <i className="bi bi-hand-thumbs-up me-1"></i> 
                <span>{comment.likes?.length || 0}</span>
              </small>
              <button 
                className="btn btn-sm p-0 text-white"
                onClick={() => {
                  if (!expandedReplies[comment._id]) {
                    loadReplies(comment._id);
                  }
                  setExpandedReplies(prev => ({
                    ...prev,
                    [comment._id]: !prev[comment._id]
                  }));
                }}
              >
                <i className={`bi ${expandedReplies[comment._id] ? 'bi-dash-circle' : 'bi-reply-fill'} me-1`}></i>
                <span className="small">
                  {expandedReplies[comment._id] ? 
                    "Nascondi risposte" : 
                    commentReplies[comment._id]?.length ? 
                      `Risposte (${commentReplies[comment._id].length})` : 
                      "Rispondi"}
                </span>
              </button>
              <small className="text-white ms-2">
                <button
                  className="btn btn-sm p-0 text-white"
                  onClick={() => setReplyingTo(comment._id)}
                >
                  <i className="bi bi-chat-left-text me-1"></i>
                  <span className="small">Rispondi</span>
                </button>
              </small>
            </div>
          </div>
        </div>
        
        {/* Form per rispondere */}
        {replyingTo === comment._id && (
          <div className="ms-4 mt-2">
            <Form onSubmit={(e) => { e.preventDefault(); handleAddReply(comment._id); }} className="d-flex">
              <Image 
                src={currentUser?.profilePicture || "https://i.pravatar.cc/40"} 
                roundedCircle 
                width={28} 
                height={28} 
                className="me-2" 
              />
              <Form.Control
                type="text"
                placeholder="Scrivi una risposta..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="flex-grow-1 me-2 rounded-pill"
                size="sm"
              />
              <Button type="submit" variant="primary" size="sm" disabled={!replyContent.trim()}>
                <i className="bi bi-send"></i>
              </Button>
              <Button variant="light" size="sm" className="ms-1" onClick={() => setReplyingTo(null)}>
                <i className="bi bi-x"></i>
              </Button>
            </Form>
          </div>
        )}
        
        {/* Risposte al commento */}
        {commentReplies[comment._id]?.length > 0 && expandedReplies[comment._id] && (
          <div className="ms-4">
            {commentReplies[comment._id].map((reply, replyIdx) => (
              <div key={replyIdx} className="d-flex align-items-start mb-2">
                <Image 
                  src={getProfileImageUrl(reply.author)}
                  roundedCircle 
                  width={28}
                  height={28}
                  className="me-2"
                />
                <div className="rounded p-2 flex-grow-1" style={{backgroundColor: deepPurple, border: '1px solid #2a0d40'}}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small fw-bold text-white">
                      {reply.author?.firstName || ''} {reply.author?.lastName || ''}
                    </span>
                    <small className="text-dark opacity-75">
                      {formatDate(reply.createdAt)}
                    </small>
                  </div>
                  <p className="small mb-0 text-dark" style={{color: '#000', fontWeight: '500'}}>{reply.content || ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Indicatore di caricamento per le risposte */}
        {loadingReplies[comment._id] && (
          <div className="ms-4 mt-2">
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </div>
              <span className="small text-white">Caricamento risposte...</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleLoginRedirect = () => {
    setShowLoginPrompt(false);
    // Salva il percorso corrente nel localStorage anziché usare parametri di query
    localStorage.setItem('returnPath', '/main1');
    navigate('/login');
  };

  return (
    <div className="comments-section mt-2">
      {/* Bottone per espandere/contrarre commenti */}
      <div className="d-flex align-items-center justify-content-center">
        <button 
          className="btn btn-sm text-muted p-0 mb-2"
          onClick={() => toggleComments(postId)}
        >
          <i className={`bi bi-chevron-${expandedPosts[postId] ? 'up' : 'down'} me-1`}></i>
          {expandedPosts[postId] ? 'Nascondi commenti' : `Mostra commenti (${comments.length})`}
        </button>
      </div>
      
      {/* Commenti visibili solo quando espansi */}
      {expandedPosts[postId] && (
        <>
          {/* Mappa i commenti */}
          {comments.slice(0, displayCommentCount).map((comment, index) => 
            renderComments(comment, index)
          )}
          
          {/* Opzione "Visualizza altri commenti" */}
          {comments.length > displayCommentCount && (
            <div className="text-center mt-2">
              <button 
                className="btn btn-sm btn-link text-decoration-none"
                onClick={() => isLoggedIn ? setDisplayCommentCount(prev => prev + 3) : setShowLoginPrompt(true)}
              >
                Visualizza altri commenti ({comments.length - displayCommentCount})
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Modal per prompt login */}
      <Modal 
        show={showLoginPrompt} 
        onHide={() => setShowLoginPrompt(false)} 
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{backgroundColor: tumblrBlue, color: 'white'}}>
          <Modal.Title>
            <i className="bi bi-exclamation-circle me-2"></i>
            Ehi Popper! Ti sei dimenticato di accedere!
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="text-center py-4">
          <i className="bi bi-person-lock display-1 text-warning mb-3"></i>
          <h5>Per mettere like o commentare devi prima accedere</h5>
          <p className="text-muted">Accedi al tuo account per interagire con i contenuti</p>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLoginPrompt(false)}>
            Annulla
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              localStorage.setItem('returnPath', '/main1');
              setShowLoginPrompt(false);
              navigate('/');
            }}
            style={{backgroundColor: tumblrBlue, borderColor: darkBlue}}
          >
            Accedi ora
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => {
              setShowLoginPrompt(false); // Chiudi il modal
              openRegistrationForm(); // Apri il form di registrazione
            }}
          >
            Registrati
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Form commento solo per utenti loggati - stile semplificato */}
      {isLoggedIn && (
        <Form onSubmit={handleNewComment} className="d-flex mt-2">
          <Image 
            src={currentUser?.profilePicture || "https://i.pravatar.cc/40"} 
            roundedCircle 
            width={32} 
            height={32} 
            className="me-2" 
          />
          <Form.Control
            type="text"
            placeholder="Scrivi un commento..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-grow-1 me-2 rounded-pill" // Rounded per seguire lo stile Facebook
            size="sm"
          />
          <Button type="submit" variant="primary" disabled={!newComment.trim()} size="sm">
            <i className="bi bi-send"></i>
          </Button>
        </Form>
      )}
    </div>
  );
}