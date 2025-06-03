import React, { useState, useEffect } from 'react';
import { Form, Button, Image, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { 
  addComment, 
  deleteComment, 
  updateComment, 
  addReply, 
  likeComment, 
  unlikeComment 
} from '../api/PostAPI';
import { toast } from 'react-toastify';

/**
 * Componente per gestire commenti, risposte e like in stile Facebook
 */
const AddComAndLikeMyPost = ({ 
  postId, 
  comments = [], 
  onCommentAdded,
  onCommentChanged,
  onCommentDeleted
}) => {
  const { currentUser } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentLikes, setCommentLikes] = useState({});
  const [likeProcessing, setLikeProcessing] = useState({}); // Per evitare doppi click

  // Aggiungi questi stati per la paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const COMMENTS_PER_PAGE = 5;

  // Aggiungi questo stato per le risposte paginate
  const [expandedReplyPages, setExpandedReplyPages] = useState({});
  const REPLIES_PER_PAGE = 3;

  // Visualizza solo i commenti per la pagina corrente
  const displayedComments = comments.slice(0, currentPage * COMMENTS_PER_PAGE);

  // Verifica se ci sono altri commenti disponibili
  useEffect(() => {
    setHasMoreComments(comments.length > currentPage * COMMENTS_PER_PAGE);
  }, [comments, currentPage]);

  // Funzione per caricare altri commenti
  const loadMoreComments = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(false);
    }, 300); // Simulazione di caricamento
  };

  // Sanitizza i dati dei commenti per evitare errori
  useEffect(() => {
    if (comments) {
      // Assicurati che tutti i commenti abbiano la proprietà likes
      const sanitizedComments = comments.map(comment => {
        // Clona il commento per evitare mutazioni
        const sanitizedComment = { ...comment, likes: comment.likes || [] };
        
        // Inizializza anche le risposte se esistono
        if (comment.replies && comment.replies.length > 0) {
          sanitizedComment.replies = comment.replies.map(reply => ({
            ...reply,
            likes: reply.likes || []
          }));
        } else {
          sanitizedComment.replies = [];
        }
        
        return sanitizedComment;
      });
      
      // Aggiorna i conteggi dei like
      const likesState = {};
      sanitizedComments.forEach(comment => {
        likesState[comment._id] = comment.likes?.length || 0;
        
        comment.replies.forEach(reply => {
          likesState[reply._id] = reply.likes?.length || 0;
        });
      });
      
      setCommentLikes(likesState);
    }
  }, [comments]);

  // Inizializza lo stato dei like e delle risposte espanse
  useEffect(() => {
    const likesState = {};
    const repliesState = {};
    
    comments.forEach(comment => {
      likesState[comment._id] = comment.likes?.length || 0;
      
      // Espandi automaticamente le risposte se sono poche (meno di 3)
      if (comment.replies && comment.replies.length > 0) {
        repliesState[comment._id] = comment.replies.length <= 3;
        
        // Aggiungi anche i like alle risposte
        comment.replies.forEach(reply => {
          likesState[reply._id] = reply.likes?.length || 0;
        });
      }
    });
    
    setCommentLikes(likesState);
    setExpandedReplies(repliesState);
  }, [comments]);

  /**
   * Gestisce l'invio di un nuovo commento
   */
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await addComment(postId, commentText);
      
      // Pulisci il form e notifica il componente padre
      setCommentText('');
      
      if (onCommentAdded) {
        onCommentAdded(response.comment);
      }
      
      toast.success("Commento aggiunto");
    } catch (error) {
      console.error("Errore nell'invio del commento:", error);
      toast.error("Non è stato possibile pubblicare il commento");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gestisce l'invio di una risposta a un commento
   */
  const handleSubmitReply = async (commentId) => {
    if (!replyText.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await addReply(postId, commentId, replyText);
      
      // Aggiungi la risposta nello stato locale
      const updatedComments = comments.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), response.comment]
          };
        }
        return comment;
      });
      
      // Aggiorna il conteggio dei like anche per la nuova risposta
      setCommentLikes(prev => ({
        ...prev,
        [response.comment._id]: 0
      }));
      
      // Espandi le risposte
      setExpandedReplies(prev => ({
        ...prev,
        [commentId]: true
      }));
      
      // Pulisci il form e resetta lo stato
      setReplyText('');
      setReplyingTo(null);
      
      if (onCommentChanged) {
        onCommentChanged(updatedComments);
      }
      
      toast.success("Risposta aggiunta");
    } catch (error) {
      console.error("Errore nell'invio della risposta:", error);
      toast.error("Non è stato possibile pubblicare la risposta");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gestisce la modifica di un commento
   */
  const handleUpdateComment = async (commentId) => {
    if (!editText.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await updateComment(commentId, editText);
      
      // Aggiorna i commenti con il commento modificato
      const updatedComments = comments.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            content: editText
          };
        }
        
        // Controlla anche nelle risposte
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => {
            if (reply._id === commentId) {
              return {
                ...reply,
                content: editText
              };
            }
            return reply;
          });
          
          return {
            ...comment,
            replies: updatedReplies
          };
        }
        
        return comment;
      });
      
      // Resetta lo stato di modifica
      setEditingComment(null);
      setEditingReply(null);
      setEditText('');
      
      if (onCommentChanged) {
        onCommentChanged(updatedComments);
      }
      
      toast.success("Commento aggiornato");
    } catch (error) {
      console.error("Errore nell'aggiornare il commento:", error);
      toast.error("Non è stato possibile aggiornare il commento");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gestisce l'eliminazione di un commento
   */
  const handleDeleteComment = async (commentId, isReply = false, parentCommentId = null) => {
    if (isSubmitting) return;
    
    if (!window.confirm("Sei sicuro di voler eliminare questo commento?")) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await deleteComment(commentId);
      
      let updatedComments;
      
      if (isReply && parentCommentId) {
        // Se è una risposta, rimuovila dalla lista di risposte del commento padre
        updatedComments = comments.map(comment => {
          if (comment._id === parentCommentId) {
            return {
              ...comment,
              replies: (comment.replies || []).filter(reply => reply._id !== commentId)
            };
          }
          return comment;
        });
      } else {
        // Se è un commento principale, rimuovilo dalla lista
        updatedComments = comments.filter(comment => comment._id !== commentId);
      }
      
      if (onCommentDeleted) {
        onCommentDeleted(commentId, isReply, parentCommentId);
      } else if (onCommentChanged) {
        onCommentChanged(updatedComments);
      }
      
      toast.success("Commento eliminato");
    } catch (error) {
      console.error("Errore nell'eliminare il commento:", error);
      toast.error("Non è stato possibile eliminare il commento");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gestisce i like ai commenti
   */
  const handleCommentLike = async (commentId, isLiked) => {
    // Evita doppi click
    if (likeProcessing[commentId]) return;
    
    setLikeProcessing(prev => ({ ...prev, [commentId]: true }));
    
    try {
      if (isLiked) {
        await unlikeComment(commentId);
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: Math.max((prev[commentId] || 0) - 1, 0)
        }));
      } else {
        await likeComment(commentId);
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: (prev[commentId] || 0) + 1
        }));
      }
    } catch (error) {
      console.error("Errore nel gestire il like al commento:", error);
    } finally {
      setLikeProcessing(prev => ({ ...prev, [commentId]: false }));
    }
  };

  /**
   * Verifica se un commento/risposta appartiene all'utente corrente
   */
  const isOwnComment = (comment) => {
    if (!currentUser) return false;
    return comment.author?._id === currentUser._id;
  };

  /**
   * Verifica se l'utente ha già messo like a un commento
   */
  const hasLiked = (comment) => {
    if (!currentUser || !comment || !comment.likes) return false;
    
    return comment.likes.some(like => {
      if (typeof like === 'string') {
        return like === currentUser._id;
      } else if (typeof like === 'object' && like !== null) {
        return like._id === currentUser._id;
      }
      return false;
    });
  };

  const toggleReplies = (commentId) => {
    // Se stiamo espandendo le risposte per la prima volta, imposta la pagina iniziale
    if (!expandedReplies[commentId]) {
      setExpandedReplyPages(prev => ({
        ...prev,
        [commentId]: 1 // Inizia con la prima pagina
      }));
    }
    
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const loadMoreReplies = (commentId) => {
    // Aumenta il numero di risposte visualizzate per questo commento
    setExpandedReplyPages(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || 1) + 1
    }));
  };

  return (
    <div className="comment-section h-100 d-flex flex-column">
      {/* Form per aggiungere commento */}
      <Form onSubmit={handleSubmitComment} className="mb-3">
        <div className="d-flex align-items-start">
          <Image 
            src={currentUser?.profilePicture || 'https://i.pravatar.cc/40'} 
            roundedCircle 
            width={32} 
            height={32}
            className="me-2 mt-1"
          />
          <div className="flex-grow-1">
            <Form.Group className="mb-1">
              <Form.Control
                as="textarea"
                rows={1}
                placeholder="Scrivi un commento..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="rounded-pill"
                onKeyDown={(e) => {
                  // Non permettere invio con Enter per evitare refresh
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Group>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={!commentText.trim() || isSubmitting}
              className="rounded-pill"
              size="sm"
            >
              {isSubmitting ? (
                <><i className="bi bi-hourglass"></i> Pubblicando...</>
              ) : (
                <><i className="bi bi-send"></i> Pubblica</>
              )}
            </Button>
          </div>
        </div>
      </Form>
      
      {/* Lista dei commenti con scroll controllato */}
      <div className="comments-list flex-grow-1 overflow-auto" style={{ maxHeight: "calc(100% - 90px)" }}>
        {displayedComments.length > 0 ? (
          <>
            {displayedComments.map(comment => (
              <div key={comment._id} className="comment mb-3 pb-2 border-bottom">
                <div className="d-flex">
                  <Image 
                    src={comment.author?.profilePicture || 'https://i.pravatar.cc/40'} 
                    roundedCircle 
                    width={36} 
                    height={36}
                    className="me-2 mt-1"
                  />
                  <div className="flex-grow-1">
                    {/* Commento in modalità modifica o visualizzazione */}
                    {editingComment === comment._id ? (
                      <div className="edit-comment-form mb-2">
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="mb-2"
                        />
                        <div className="d-flex">
                          <Button 
                            variant="primary" 
                            size="sm"
                            className="me-2"
                            onClick={() => handleUpdateComment(comment._id)}
                            disabled={!editText.trim() || isSubmitting}
                          >
                            Salva
                          </Button>
                          <Button 
                            variant="light" 
                            size="sm"
                            onClick={() => setEditingComment(null)}
                          >
                            Annulla
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="comment-bubble p-2 bg-light rounded">
                        <div className="d-flex justify-content-between">
                          <h6 className="mb-1">
                            {comment.author?.firstName || ''} {comment.author?.lastName || ''}
                          </h6>
                          
                          {/* Menu azioni (solo per i propri commenti) */}
                          {isOwnComment(comment) && (
                            <Dropdown align="end">
                              <Dropdown.Toggle 
                                variant="link"
                                className="p-0 text-muted"
                                id={`dropdown-comment-${comment._id}`}
                              >
                                <i className="bi bi-three-dots"></i>
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item
                                  onClick={() => {
                                    setEditingComment(comment._id);
                                    setEditText(comment.content);
                                  }}
                                >
                                  <i className="bi bi-pencil me-2"></i> Modifica
                                </Dropdown.Item>
                                <Dropdown.Item 
                                  className="text-danger"
                                  onClick={() => handleDeleteComment(comment._id)}
                                >
                                  <i className="bi bi-trash me-2"></i> Elimina
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          )}
                        </div>
                        <p className="mb-1">{comment.content}</p>
                        <small className="text-muted">
                          {new Date(comment.createdAt).toLocaleDateString()} 
                          {comment.updatedAt && comment.updatedAt !== comment.createdAt && 
                            " (modificato)"}
                        </small>
                      </div>
                    )}
                    
                    {/* Azioni sul commento */}
                    <div className="comment-actions d-flex mt-1 mb-2">
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none me-3"
                        onClick={() => handleCommentLike(comment._id, hasLiked(comment))}
                      >
                        <small>
                          <i className={`bi ${hasLiked(comment) ? 'bi-hand-thumbs-up-fill text-primary' : 'bi-hand-thumbs-up'} me-1`}></i>
                          {commentLikes[comment._id] || 0} Mi piace
                        </small>
                      </Button>
                      
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none me-3"
                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                      >
                        <small>
                          <i className="bi bi-reply me-1"></i> Rispondi
                        </small>
                      </Button>
                      
                      {(comment.replies && comment.replies.length > 0) && (
                        <Button 
                          variant="link" 
                          className="p-0 text-decoration-none"
                          onClick={() => toggleReplies(comment._id)}
                        >
                          <small>
                            <i className={`bi ${expandedReplies[comment._id] ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                            {expandedReplies[comment._id] ? 'Nascondi risposte' : `Mostra risposte (${comment.replies.length})`}
                          </small>
                        </Button>
                      )}
                    </div>
                    
                    {/* Form per rispondere */}
                    {replyingTo === comment._id && (
                      <div className="reply-form mb-3 ms-4">
                        <div className="d-flex">
                          <Image 
                            src={currentUser?.profilePicture || 'https://i.pravatar.cc/30'} 
                            roundedCircle 
                            width={28} 
                            height={28}
                            className="me-2"
                          />
                          <div className="flex-grow-1">
                            <Form.Control
                              as="textarea"
                              rows={1}
                              placeholder={`Rispondi a ${comment.author?.firstName || 'utente'}...`}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="mb-2 rounded-pill"
                              size="sm"
                            />
                            <div className="d-flex">
                              <Button 
                                variant="primary" 
                                size="sm"
                                className="me-2 rounded-pill"
                                onClick={() => handleSubmitReply(comment._id)}
                                disabled={!replyText.trim() || isSubmitting}
                              >
                                Rispondi
                              </Button>
                              <Button 
                                variant="light" 
                                size="sm"
                                className="rounded-pill"
                                onClick={() => setReplyingTo(null)}
                              >
                                Annulla
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Risposte ai commenti */}
                    {expandedReplies[comment._id] && comment.replies && comment.replies.length > 0 && (
                      <div className="replies ms-4 mt-2">
                        {/* Mostra solo le risposte per la pagina corrente */}
                        {comment.replies
                          .slice(0, (expandedReplyPages[comment._id] || 1) * REPLIES_PER_PAGE)
                          .map(reply => (
                            <div key={reply._id} className="reply mb-2">
                              <div className="d-flex">
                                <Image 
                                  src={reply.author?.profilePicture || 'https://i.pravatar.cc/30'} 
                                  roundedCircle 
                                  width={28} 
                                  height={28}
                                  className="me-2"
                                />
                                <div className="flex-grow-1">
                                  {editingReply === reply._id ? (
                                    <div className="edit-reply-form mb-2">
                                      <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="mb-2"
                                        size="sm"
                                      />
                                      <div className="d-flex">
                                        <Button 
                                          variant="primary" 
                                          size="sm"
                                          className="me-2"
                                          onClick={() => handleUpdateComment(reply._id)}
                                          disabled={!editText.trim() || isSubmitting}
                                        >
                                          Salva
                                        </Button>
                                        <Button 
                                          variant="light" 
                                          size="sm"
                                          onClick={() => setEditingReply(null)}
                                        >
                                          Annulla
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="reply-bubble p-2 bg-secondary bg-opacity-10 rounded">
                                      <div className="d-flex justify-content-between align-items-center">
                                        <span className="fw-bold small">
                                          {reply.author?.firstName || ''} {reply.author?.lastName || ''}
                                        </span>
                                        
                                        {isOwnComment(reply) && (
                                          <Dropdown align="end">
                                            <Dropdown.Toggle 
                                              variant="link"
                                              className="p-0 text-muted"
                                              id={`dropdown-reply-${reply._id}`}
                                              size="sm"
                                            >
                                              <i className="bi bi-three-dots"></i>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                              <Dropdown.Item
                                                onClick={() => {
                                                  setEditingReply(reply._id);
                                                  setEditText(reply.content);
                                                }}
                                              >
                                                <i className="bi bi-pencil me-2"></i> Modifica
                                              </Dropdown.Item>
                                              <Dropdown.Item 
                                                className="text-danger"
                                                onClick={() => handleDeleteComment(reply._id, true, comment._id)}
                                              >
                                                <i className="bi bi-trash me-2"></i> Elimina
                                              </Dropdown.Item>
                                            </Dropdown.Menu>
                                          </Dropdown>
                                        )}
                                      </div>
                                      
                                      <p className="mb-1 small">{reply.content}</p>
                                      
                                      <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                          {new Date(reply.createdAt).toLocaleDateString()}
                                          {reply.updatedAt && reply.updatedAt !== reply.createdAt && 
                                            " (modificato)"}
                                        </small>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Azioni della risposta */}
                                  <div className="reply-actions ms-1 mt-1">
                                    <Button 
                                      variant="link" 
                                      className="p-0 text-decoration-none me-2"
                                      size="sm"
                                      onClick={() => handleCommentLike(reply._id, hasLiked(reply))}
                                    >
                                      <small>
                                        <i className={`bi ${hasLiked(reply) ? 'bi-hand-thumbs-up-fill text-primary' : 'bi-hand-thumbs-up'} me-1`}></i>
                                        {commentLikes[reply._id] || 0}
                                      </small>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        
                        {/* Pulsante "Carica altre risposte" se ci sono più risposte */}
                        {comment.replies.length > (expandedReplyPages[comment._id] || 1) * REPLIES_PER_PAGE && (
                          <div className="text-center my-2">
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 text-decoration-none"
                              onClick={() => loadMoreReplies(comment._id)}
                            >
                              <small>
                                <i className="bi bi-plus-circle me-1"></i>
                                Mostra altre risposte ({comment.replies.length - (expandedReplyPages[comment._id] || 1) * REPLIES_PER_PAGE})
                              </small>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pulsante "Carica altri commenti" */}
            {hasMoreComments && (
              <div className="text-center my-3">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  disabled={isLoadingMore}
                  onClick={loadMoreComments}
                  className="rounded-pill"
                >
                  {isLoadingMore ? (
                    <><i className="bi bi-hourglass-split me-1"></i> Caricamento...</>
                  ) : (
                    <><i className="bi bi-plus-circle me-1"></i> Carica altri commenti</>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-muted my-4">
            Non ci sono ancora commenti. Sii il primo a commentare!
          </p>
        )}
      </div>

      <style>
        {`
          .comment-bubble, .reply-bubble {
            max-width: 100%;
            word-break: break-word;
          }
          .comments-list {
            scrollbar-width: thin;
          }
          .comments-list::-webkit-scrollbar {
            width: 6px;
          }
          .comments-list::-webkit-scrollbar-thumb {
            background-color: rgba(0,0,0,0.2);
            border-radius: 3px;
          }
          .edit-comment-form textarea,
          .edit-reply-form textarea {
            max-height: 100px;
          }
        `}
      </style>
    </div>
  );
};

export default AddComAndLikeMyPost;