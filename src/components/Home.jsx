import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Image, Button, Form, Spinner, Modal, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { 
  getPosts, 
  likePost, 
  unlikePost
} from '../api/PostAPI';
import CommentModal from './CommentModal'; // Modifica la riga di importazione esistente
import PostModal from './PostModal'; // Aggiunta importazione
import { useNavigate } from 'react-router-dom';

 // Definizione dei colori
// const tumblrBlue = '#001935';

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Stati per gestire i dati
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  
  // Stati per paginazione infinita
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const loadMoreRef = useRef(null);
  
  // Stati per il modale dei commenti
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);

  // Stato per il PostModal
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Sostituzione dell'useEffect di debug esistente con uno specifico
  useEffect(() => {
    if (posts && posts.length > 0) {
      posts.forEach(post => {
        // console.log rimosso
      });
    }
  }, [posts]);
  
  // Carica i post all'avvio del componente
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await getPosts();
      setPosts(response.posts || []);
    } catch (err) {
      console.error("Errore nel caricamento dei post:", err);
      setError("Si è verificato un errore nel caricamento dei post.");
    } finally {
      setLoading(false);
    }
  };

  // Funzione per caricare più post (paginazione) con useCallback
  const loadMorePosts = useCallback(async () => {
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      
      // Ottieni headers di autenticazione
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fai la richiesta con gli headers
      const response = await axiosInstance.get(`/posts?page=${nextPage}&limit=10`, { headers });
      
      // Se non ci sono più post, imposta hasMorePosts a false
      if (!response.data.posts || response.data.posts.length === 0) {
        setHasMorePosts(false);
        return;
      }
      
      // Altrimenti, aggiungi i nuovi post a quelli esistenti
      setPosts(prevPosts => [...prevPosts, ...response.data.posts]);
      setPage(nextPage);
    } catch (error) {
      console.error("Errore nel caricamento di più post:", error);
      setHasMorePosts(false); // In caso di errore, interrompi i tentativi
    } finally {
      setIsLoadingMore(false);
    }
  }, [page]);

  // Correggi l'useEffect dell'Intersection Observer
  useEffect(() => {
    // Non osservare se non ci sono più post da caricare
    if (!hasMorePosts) return;
    
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isLoadingMore) {
        loadMorePosts();
      }
    }, { threshold: 0.5 });
    
    // Copia il riferimento attuale per evitare problemi di cleanup
    const currentRef = loadMoreRef.current;
    
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isLoadingMore, hasMorePosts, loadMorePosts]);

  // Funzione per gestire il mi piace sui post
  const handleLikePost = async (postId) => {
    try {
      // Trova il post e controlla se l'utente ha già messo like
      const post = posts.find(p => p._id === postId);
      const hasLiked = post.likes?.includes(currentUser._id);
      
      if (hasLiked) {
        // L'utente ha già messo like, quindi rimuovilo
        await unlikePost(postId);
        // Aggiorna lo stato locale
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            const newLikes = p.likes.filter(id => id !== currentUser._id);
            return {
              ...p,
              likes: newLikes,
              likeCount: (p.likeCount || p.likes.length) - 1
            };
          }
          return p;
        }));
      } else {
        // L'utente non ha messo like, aggiungilo
        await likePost(postId);
        // Aggiorna lo stato locale
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            const newLikes = [...(p.likes || []), currentUser._id];
            return {
              ...p,
              likes: newLikes,
              likeCount: (p.likeCount || p.likes?.length || 0) + 1
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error("Errore nella gestione del like:", err);
    }
  };

  // Funzione per aprire il modale dei commenti
  const handleOpenComments = (postId) => {
    const post = posts.find(p => p._id === postId);
    setCurrentPostId(postId);
    setShowCommentModal(true);
  };
  
  // Modifica questa funzione per essere sicuri che il conteggio sia aggiornato correttamente
  const handleCommentCountUpdated = (postId, mainCommentsCount) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post._id === postId) {
        // Aggiorna SOLO se il conteggio è effettivamente cambiato
        if (post.commentCount !== mainCommentsCount) {
          return { ...post, commentCount: mainCommentsCount };
        }
      }
      return post;
    }));
  };

  // Usa la stessa logica per entrambi i callback
  const handleCommentAdded = handleCommentCountUpdated;
  const handleCommentDeleted = handleCommentCountUpdated;


  // Rendering dei post
  const renderPosts = () => (
    <>
      {posts.map(post => (
        <Card key={post._id} className="mb-4">
          <Card.Header className="bg-white">
            <div className="d-flex align-items-center">
              <div 
                className="profile-hover-effect"
                onClick={() => navigate(`/visit/${post.author?._id}`)}
                style={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  borderRadius: '50%',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Image 
                  src={post.author?.profilePicture || `https://i.pravatar.cc/40?img=${post.author?.firstName?.charCodeAt(0) || 1}`} 
                  roundedCircle 
                  width={40} 
                  height={40} 
                />
              </div>
              <div 
                className="ms-2" 
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/visit/${post.author?._id}`)}
              >
                <div 
                  className="fw-bold username-hover-effect"
                  style={{
                    transition: 'transform 0.3s ease, color 0.2s ease',
                    display: 'inline-block'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.color = '#0d6efd';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.color = '';
                  }}
                >
                  {post.author?.firstName || ''} {post.author?.lastName || ''}
                </div>
                <small className="text-muted d-block">
                  {new Date(post.createdAt).toLocaleDateString()} {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </small>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <Card.Text>{post.content}</Card.Text>
          </Card.Body>
          {post.cover && (
            <div style={{ 
              height: '400px', /* Altezza fissa invece di maxHeight */
              width: '100%',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              cursor: 'pointer'
            }} onClick={() => setSelectedPost(post)}>
              <Card.Img 
                variant="bottom" 
                src={post.cover} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', /* 'cover' invece di 'contain' per riempire lo spazio */
                  objectPosition: 'center'
                }}
              />
            </div>
          )}
          <Card.Footer className="bg-white">
            <div className="d-flex justify-content-between mb-2">
              <span>
                <i className="bi bi-hand-thumbs-up-fill text-primary me-1"></i> 
                {post.likeCount || post.likes?.length || 0}
              </span>
              <span>{post.commentCount || post.comments?.length || 0} commenti</span>
            </div>
            <hr className="my-1" />
            <div className="d-flex justify-content-between py-1">
              <Button 
                variant="light" 
                size="sm" 
                className="flex-grow-1"
                onClick={() => handleLikePost(post._id)}
              >
                <i className={`bi ${post.likes?.includes(currentUser?._id) ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'} me-1`}></i>
                <span className="d-none d-sm-inline">Mi piace</span>
              </Button>
              <Button 
                variant="light" 
                size="sm" 
                className="flex-grow-1"
                onClick={() => handleOpenComments(post._id)}
              >
                <i className="bi bi-chat-left-text me-1"></i>
                <span className="d-none d-sm-inline">Commenta</span>
              </Button>
              <Button 
                variant="light" 
                size="sm" 
                className="flex-grow-1 d-none d-sm-block"
              >
                <i className="bi bi-share me-1"></i>
                <span className="d-none d-sm-inline">Condividi</span>
              </Button>
            </div>
          </Card.Footer>
        </Card>
      ))}
      
      {/* Elemento di paginazione */}
      {posts.length > 0 && hasMorePosts && (
        <div ref={loadMoreRef} className="text-center py-3 mt-2">
          {isLoadingMore ? (
            <div className="d-flex justify-content-center align-items-center">
              <div className="spinner-border text-primary me-2" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </div>
              <span>Caricamento post...</span>
            </div>
          ) : (
            <button 
              className="btn btn-outline-primary" 
              onClick={loadMorePosts}
              disabled={isLoadingMore}
            >
              Carica altri post
            </button>
          )}
        </div>
      )}
    </>
  );

  // Rendering principale
  return (
    <div className="container py-4">
    
      
      {/* Messaggio di caricamento o errore */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Caricamento...</span>
          </Spinner>
          <p className="mt-2">Caricamento post in corso...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        /* Lista dei post */
        renderPosts()
      )}
      
      {/* Modale dei commenti */}
      <CommentModal 
        showModal={showCommentModal} 
        onHide={() => setShowCommentModal(false)}
        postId={currentPostId}
        onCommentAdded={handleCommentAdded}
        onCommentDeleted={handleCommentDeleted}
        onCommentCountUpdated={handleCommentCountUpdated}
      />

      {/* PostModal per visualizzare il post completo */}
      <PostModal 
        show={!!selectedPost}
        onHide={() => setSelectedPost(null)}
        post={selectedPost}
        userPosts={posts}
        onCommentAdded={(postId, exactCount) => {
          setPosts(prevPosts => prevPosts.map(post => {
            if (post._id === postId) {
              return { ...post, commentCount: exactCount };
            }
            return post;
          }));
        }}
      />
    </div>
  );
}






