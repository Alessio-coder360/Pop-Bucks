import React, { useState, useEffect } from 'react';
import { Image, Button, Form, Modal, Spinner, InputGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { 
  getPostComments,
  addComment,
  deleteComment,
  updateComment,  // Assicurati che questa sia importata
  likeComment,
  unlikeComment,
  getCommentReplies,
  addReply
} from '../api/PostAPI';

// Definizione dei colori
const tumblrBlue = '#001935';
const deepPurple = '#3a1657';

const CommentModal = ({ 
  showModal, 
  onHide, 
  postId,
  onCommentCountUpdated, // Modifica prop per notificare solo i commenti principali
  onCommentAdded,
  onCommentDeleted
}) => {
  const { currentUser } = useAuth();
  
  // Stati per il modale dei commenti
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  
  // Stati per gestire le risposte ai commenti
  const [expandedReplies, setExpandedReplies] = useState({});
  const [commentReplies, setCommentReplies] = useState({});
  
  // Stati per modifica delle risposte
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');

  // Carica i commenti quando si apre il modale o cambia il postId
  useEffect(() => {
    if (showModal && postId) {
      fetchComments(postId);
    }
    // Reset dello stato quando si chiude il modale
    return () => {
      if (!showModal) {
        setComments([]);
        setCommentReplies({});
        setExpandedReplies({});
      }
    };
  }, [showModal, postId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Funzione per caricare le risposte di un commento
  const loadReplies = async (commentId) => {
    try {
      const response = await getCommentReplies(postId, commentId);
      
      if (response && Array.isArray(response.replies)) {
        // Aggiorna lo stato delle risposte
        setCommentReplies(prev => ({
          ...prev,
          [commentId]: response.replies
        }));
        
        // Espandi automaticamente le risposte caricate
        setExpandedReplies(prev => ({
          ...prev,
          [commentId]: true
        }));
      }
    } catch (error) {
      console.error("❌ Errore nel caricamento delle risposte:", error);
    }
  };

  // MODIFICA: Funzione fetchComments per contare SOLO i commenti principali
  const fetchComments = async (postId) => {
    try {
      setLoadingComments(true);
      
      const response = await getPostComments(postId);
      const commentsList = response.comments || [];
      setComments(commentsList);
      
      // Carica le risposte come prima
      const repliesPromises = commentsList.map(async (comment) => {
        try {
          const repliesResponse = await getCommentReplies(postId, comment._id);
          if (repliesResponse && Array.isArray(repliesResponse.replies)) {
            return {
              commentId: comment._id,
              replies: repliesResponse.replies
            };
          }
        } catch (error) {
          return { commentId: comment._id, replies: [] };
        }
      });
      
      // Gestione risposte come prima
      const repliesResults = await Promise.all(repliesPromises);
      const newReplies = {};
      repliesResults.forEach(result => {
        if (result && result.commentId) {
          newReplies[result.commentId] = result.replies;
        }
      });
      setCommentReplies(newReplies);
      
      // IMPORTANTE: Conta SOLO i commenti principali per il conteggio post
      const mainCount = commentsList.length;
      const repliesCount = Object.values(newReplies).reduce(
        (total, replies) => total + replies.length,
        0
      );
      
      
      // Notifica SOLO il numero di commenti principali
      if (onCommentCountUpdated) {
        onCommentCountUpdated(postId, mainCount);
      }
      
    } catch (err) {
      // Gestione errori
    } finally {
      setLoadingComments(false);
    }
  };

  // MODIFICA: Funzione per aggiungere commento
  const handleAddComment = async () => {
    if (!commentContent.trim()) return;
    
    try {
      const response = await addComment(postId, commentContent);
      
      // Aggiungi il nuovo commento all'inizio
      const updatedComments = [response.comment, ...comments];
      setComments(updatedComments);
      
      // IMPORTANTE: Conta SOLO i commenti principali
      const newMainCount = updatedComments.length;
      
      
      if (onCommentAdded) {
        onCommentAdded(postId, newMainCount);
      }
      
      setCommentContent('');
    } catch (err) {
      // Gestione errori
    }
  };

  // Funzione per iniziare la modifica di un commento
  const startEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentContent(comment.content);
  };

  // Funzione per aggiornare un commento modificato
  const handleUpdateComment = async () => {
    if (!editingCommentId || !editCommentContent.trim()) return;
    
    try {
      await updateComment(editingCommentId, editCommentContent);
      
      // Aggiorna il commento localmente
      setComments(prev => prev.map(c => 
        c._id === editingCommentId 
          ? { ...c, content: editCommentContent } 
          : c
      ));
      
      // Resetta lo stato di modifica
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (err) {
      console.error("Errore nell'aggiornamento del commento:", err);
    }
  };

  // MODIFICA: Funzione per eliminare commento
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      
      // Determina se è un commento principale o una risposta
      const isMainComment = comments.some(c => c._id === commentId);
      
      if (isMainComment) {
        // Rimuovi il commento principale
        const updatedComments = comments.filter(c => c._id !== commentId);
        setComments(updatedComments);
        
        // Rimuovi anche le risposte associate
        const updatedReplies = { ...commentReplies };
        delete updatedReplies[commentId];
        setCommentReplies(updatedReplies);
        
        // IMPORTANTE: Aggiorna il conteggio SOLO se era un commento principale
        const newMainCount = updatedComments.length;
        
        
        if (onCommentDeleted) {
          onCommentDeleted(postId, newMainCount);
        }
      } else {
        // Era una risposta: trova a quale commento apparteneva
        for (const [parentId, replies] of Object.entries(commentReplies)) {
          if (replies.some(r => r._id === commentId)) {
            // Aggiorna le risposte rimuovendo quella eliminata
            setCommentReplies(prev => ({
              ...prev,
              [parentId]: prev[parentId].filter(r => r._id !== commentId)
            }));
            break;
          }
        }
        
        // IMPORTANTE: Non aggiornare il conteggio principale quando si elimina una risposta
      }
    } catch (err) {
      // Gestione errori
    }
  };

  // Migliora la funzione handleLikeComment per gestire meglio gli errori e aggiornare lo stato in modo ottimistico
  const handleLikeComment = async (commentId) => {
    try {
      // Trova il commento
      const commentIndex = comments.findIndex(c => c._id === commentId);
      const replyInfo = commentIndex === -1 ? findReplyInfo(commentId) : null;
      
      // Se non è né un commento né una risposta, esci
      if (commentIndex === -1 && !replyInfo) {
        console.error("Commento non trovato:", commentId);
        return;
      }
      
      const isReply = commentIndex === -1;
      const comment = isReply 
        ? commentReplies[replyInfo.parentId][replyInfo.replyIndex]
        : comments[commentIndex];
      
      // Controlla se l'utente ha già messo like
      const hasLiked = comment.likes && comment.likes.includes(currentUser._id);
      
      // Aggiorna lo stato in modo ottimistico (prima della chiamata API)
      if (isReply) {
        // Aggiorna una risposta
        setCommentReplies(prev => {
          const newReplies = [...prev[replyInfo.parentId]];
          const newLikes = hasLiked
            ? comment.likes.filter(id => id !== currentUser._id) 
            : [...(comment.likes || []), currentUser._id];
          
          newReplies[replyInfo.replyIndex] = {
            ...comment,
            likes: newLikes
          };
          
          return {
            ...prev,
            [replyInfo.parentId]: newReplies
          };
        });
      } else {
        // Aggiorna un commento principale
        setComments(prev => {
          return prev.map((c, i) => {
            if (i === commentIndex) {
              const newLikes = hasLiked 
                ? c.likes.filter(id => id !== currentUser._id)
                : [...(c.likes || []), currentUser._id];
              
              return {
                ...c,
                likes: newLikes
              };
            }
            return c;
          });
        });
      }
      
      // Esegui l'azione API
      try {
        if (hasLiked) {
          await unlikeComment(commentId);
        } else {
          await likeComment(commentId);
        }
      } catch (apiError) {
        // In caso di errore, ripristina lo stato precedente
        console.error("Errore API like/unlike:", apiError);
        
        // Ripristina lo stato precedente in caso di errore API
        if (isReply) {
          setCommentReplies(prev => {
            const newReplies = [...prev[replyInfo.parentId]];
            newReplies[replyInfo.replyIndex] = comment;
            
            return {
              ...prev,
              [replyInfo.parentId]: newReplies
            };
          });
        } else {
          setComments(prev => {
            const newComments = [...prev];
            newComments[commentIndex] = comment;
            return newComments;
          });
        }
        
        // Non rilanciare l'errore per evitare che la UI si rompa
      }
    } catch (err) {
      console.error("Errore nella gestione del like al commento:", err);
    }
  };

  // Funzione di supporto per trovare una risposta
  const findReplyInfo = (replyId) => {
    for (const [parentId, replies] of Object.entries(commentReplies)) {
      const replyIndex = replies.findIndex(r => r._id === replyId);
      if (replyIndex !== -1) {
        return { parentId, replyIndex };
      }
    }
    return null;
  };

  // Funzione per iniziare a rispondere a un commento
  const startReplyToComment = (commentId) => {
    setReplyingToComment(commentId);
    setReplyContent('');
  };

  // MODIFICA: Funzione per aggiungere risposta
  const handleAddReply = async () => {
    if (!replyContent.trim() || !replyingToComment) return;
    
    try {
      const response = await addReply(postId, replyingToComment, replyContent);
      
      // Aggiorna le risposte
      setCommentReplies(prev => ({
        ...prev,
        [replyingToComment]: [
          ...(prev[replyingToComment] || []),
          response.comment
        ]
      }));
      
      // Espandi le risposte
      setExpandedReplies(prev => ({
        ...prev,
        [replyingToComment]: true
      }));
      
      // IMPORTANTE: Non aggiornare il conteggio principale quando si aggiunge una risposta
      
      // Resetta stato
      setReplyingToComment(null);
      setReplyContent('');
    } catch (err) {
      // Gestione errori
    }
  };

  // Funzione per gestire l'aggiornamento di una risposta
  const handleSaveReplyEdit = async (commentId, replyId) => {
    if (!editReplyContent.trim()) return;
    
    try {
      console.log(`Aggiornamento risposta ${replyId} con contenuto: "${editReplyContent}"`);
      
      // Usa la funzione updateComment già importata da PostAPI
      const response = await updateComment(replyId, editReplyContent);
      
      // Se l'aggiornamento ha avuto successo
      if (response && response.comment) {
        console.log("✅ Risposta aggiornata con successo:", response);
        
        // Aggiorna l'interfaccia utente
        setCommentReplies(prev => {
          const updatedReplies = { ...prev };
          
          if (updatedReplies[commentId]) {
            updatedReplies[commentId] = updatedReplies[commentId].map(reply => {
              if (reply._id === replyId) {
                return { ...reply, content: editReplyContent };
              }
              return reply;
            });
          }
          
          return updatedReplies;
        });
        
        // Reimposta lo stato di modifica
        setEditingReplyId(null);
        setEditReplyContent('');
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento della risposta:", error);
    }
  };

  return (
    <Modal 
      show={showModal} 
      onHide={onHide} 
      centered 
      size="lg"
    >
      <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
        <Modal.Title>Commenti</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Input con icona aereo allineata correttamente */}
        <Form className="mb-4 d-flex">
          <Image 
            src={currentUser?.profilePicture || "https://picsum.photos/seed/user/40/40"} 
            roundedCircle 
            width={40} 
            height={40}
            className="me-2" 
          />
          <Form.Group className="flex-grow-1 position-relative">
            <Form.Control 
              as="textarea" 
              rows={1}
              placeholder="Scrivi un commento..." 
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              style={{ borderRadius: '20px', paddingRight: '40px' }}
            />
            <Button 
              variant="link"
              className="position-absolute d-flex align-items-center justify-content-center"
              style={{ right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#0d6efd', width: '32px', height: '32px' }}
              onClick={handleAddComment}
              disabled={!commentContent.trim()}
            >
              <i className="bi bi-send-fill"></i>
            </Button>
          </Form.Group>
        </Form>
        
        {/* Loading spinner */}
        {loadingComments ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Caricamento commenti...</span>
            </Spinner>
            <p className="mt-2">Caricamento commenti...</p>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted py-4">
            Nessun commento ancora. Sii il primo a commentare!
          </p>
        ) : (
          // Lista dei commenti
          <div>
            {comments.map(comment => (
              <div key={comment._id} className="mb-3 p-2">
                <div className="d-flex">
                  <Image 
                    src={comment.author?.profilePicture || `https://i.pravatar.cc/40?img=${comment.author?.firstName?.charCodeAt(0) || 1}`} 
                    roundedCircle 
                    width={40} 
                    height={40}
                    className="me-2" 
                  />
                  <div className="flex-grow-1">
                    {editingCommentId === comment._id ? (
                      <Form.Group className="mb-2">
                        <Form.Control 
                          as="textarea" 
                          rows={2}
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          autoFocus
                        />
                        <div className="d-flex justify-content-end mt-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => setEditingCommentId(null)}
                          >
                            Annulla
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={handleUpdateComment}
                          >
                            Aggiorna
                          </Button>
                        </div>
                      </Form.Group>
                    ) : (
                      <>
                        {/* Layout commento migliorato con icone a destra */}
                        <div className="bg-light p-2 rounded d-flex">
                          <div className="flex-grow-1">
                            <div className="fw-bold mb-1">
                              {comment.author?.firstName || ''} {comment.author?.lastName || ''}
                            </div>
                            <div>{comment.content}</div>
                          </div>
                          
                          {/* Icone modifica/elimina a DESTRA */}
                          {currentUser && comment.author?._id === currentUser._id && (
                            <div className="ms-2 d-flex flex-column">
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-0 mb-1"
                                onClick={() => startEditComment(comment)}
                              >
                                <i className="bi bi-pencil-square"></i>
                              </Button>
                              
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-0 text-danger"
                                onClick={() => handleDeleteComment(comment._id)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="d-flex mt-1 align-items-center">
                          <div className="comment-actions">
                            <Button 
                              variant="link" 
                              className="p-0 me-2 comment-like-btn" // Aggiungi la classe comment-like-btn
                              onClick={() => handleLikeComment(comment._id)}
                            >
                              <i className={`bi ${comment.likes?.includes(currentUser?._id) ? 'bi-heart-fill' : 'bi-heart'} me-1`}></i>
                              <small className="comment-like-count">{comment.likes?.length || 0}</small> {/* Aggiungi la classe comment-like-count */}
                            </Button>
                          </div>
                          <span className="mx-1">•</span>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 reply-btn" // Aggiungi la classe reply-btn
                            onClick={() => startReplyToComment(comment._id)}
                          >
                            Rispondi
                          </Button>
                          
                          <small className="ms-auto text-muted">
                            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </small>
                        </div>
                      </>
                    )}
                    
                    {/* Form per rispondere al commento - CORRETTO ALLINEAMENTO */}
                    {replyingToComment === comment._id && (
                      <Form className="mt-2 d-flex align-items-center">
                        <Image 
                          src={currentUser?.profilePicture || "https://picsum.photos/seed/user/30/30"} 
                          roundedCircle 
                          width={30} 
                          height={30}
                          className="me-2" 
                        />
                        <div className="flex-grow-1 d-flex">
                          <Form.Control 
                            as="textarea" 
                            rows={1}
                            placeholder="Scrivi una risposta..." 
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            autoFocus
                            className="me-2 rounded-pill"
                            style={{ resize: 'none' }}
                          />
                          <div className="d-flex align-items-center">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="me-1 rounded-circle"
                              onClick={() => setReplyingToComment(null)}
                            >
                              <i className="bi bi-x"></i>
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm"
                              className="rounded-circle"
                              onClick={handleAddReply}
                              disabled={!replyContent.trim()}
                            >
                              <i className="bi bi-send-fill"></i>
                            </Button>
                          </div>
                        </div>
                      </Form>
                    )}
                    
                    {/* Mostra le risposte al commento */}
                    {commentReplies[comment._id]?.length > 0 && (
                      <div className="ms-4 mt-2">
                        <Button 
                          variant="link" 
                          className="p-0 mb-2 toggle-replies-btn" // Aggiungi la classe toggle-replies-btn
                          onClick={() => setExpandedReplies(prev => ({
                            ...prev,
                            [comment._id]: !prev[comment._id]
                          }))}
                        >
                          {expandedReplies[comment._id] ? 'Nascondi risposte' : `Mostra ${commentReplies[comment._id].length} risposte`}
                        </Button>
                        
                        {expandedReplies[comment._id] && commentReplies[comment._id]?.map(reply => (
                          <div key={reply._id} className="ms-4 my-2 p-2 border-start border-2">
                            <div className="d-flex align-items-start">
                              <Image 
                                src={reply.author?.profilePicture || 'https://via.placeholder.com/40'} 
                                roundedCircle 
                                width={30} 
                                height={30} 
                                className="me-2" 
                              />
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <strong>{reply.author?.username || reply.author?.firstName || 'Utente'}</strong>
                                    <p className="mb-1">{
                                      editingReplyId === reply._id ? (
                                        <Form.Control
                                          as="textarea"
                                          value={editReplyContent}
                                          onChange={(e) => setEditReplyContent(e.target.value)}
                                          rows={2}
                                          className="mb-2"
                                        />
                                      ) : (
                                        reply.content
                                      )
                                    }</p>
                                    <div className="d-flex align-items-center small">
                                      {/* Sostituisci "Mi piace" con l'icona del cuore */}
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="p-0 comment-like-btn"
                                        onClick={() => handleLikeComment(reply._id)}
                                      >
                                        <i className={`bi ${reply.likes?.includes(currentUser?._id) ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
                                        <span className="ms-1">{reply.likes?.length || 0}</span>
                                      </Button>
                                      
                                      {/* Rimuovi i puntini tra i controlli */}
                                      {currentUser && reply.author?._id === currentUser._id && (
                                        <>
                                          {/* Icona modifica blu */}
                                          <Button 
                                            variant="link" 
                                            size="sm" 
                                            className="p-0 ms-3"
                                            onClick={() => {
                                              setEditingReplyId(reply._id);
                                              setEditReplyContent(reply.content);
                                            }}
                                          >
                                            <i className="bi bi-pencil-square text-primary"></i>
                                          </Button>
                                          
                                          {/* Icona cestino rossa */}
                                          <Button 
                                            variant="link" 
                                            size="sm" 
                                            className="p-0 ms-3"
                                            onClick={() => handleDeleteComment(reply._id)}
                                          >
                                            <i className="bi bi-trash text-danger"></i>
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Controlli modifica */}
                                  {editingReplyId === reply._id && (
                                    <div>
                                      <Button 
                                        variant="primary" 
                                        size="sm" 
                                        className="me-2"
                                        onClick={() => handleSaveReplyEdit(comment._id, reply._id)}
                                      >
                                        Salva
                                      </Button>
                                      <Button 
                                        variant="outline-secondary" 
                                        size="sm"
                                        onClick={() => {
                                          setEditingReplyId(null);
                                          setEditReplyContent('');
                                        }}
                                      >
                                        Annulla
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default CommentModal;