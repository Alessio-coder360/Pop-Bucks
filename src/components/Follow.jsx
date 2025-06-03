import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Image, Spinner, Row, Col } from 'react-bootstrap';
import { getUserFollowers, getUserFollowing, followUser, unfollowUser } from '../api/UserAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Follow = ({ show, onHide, userId, type, onFollowStatusChange }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followingStatus, setFollowingStatus] = useState({});
  const [followLoading, setFollowLoading] = useState([]);



  // Determina il titolo in base al tipo
  const title = type === 'followers' ? 'Follower' : 'Seguiti';

  // Migliora il debugging nella funzione fetchUsers
  const fetchUsers = async (pageToLoad) => {
    if (!show) return;
    
    try {
    
      
      const fetchFunction = type === 'followers' ? getUserFollowers : getUserFollowing;
      const response = await fetchFunction(userId, pageToLoad);
      
      
      // Verifica la risposta
      if (!response || !response[type]) {
        console.error(`❌ Risposta API non valida per ${type}:`, response);
        setError(`Errore nel formato della risposta per ${title.toLowerCase()}`);
        setLoading(false);
        return;
      }
      
      if (pageToLoad === 1) {
        setUsers(response[type]);
      } else {
        setUsers(prev => [...prev, ...response[type]]);
      }
      
      // Imposta hasMore in base ai dati di paginazione
      const totalPages = response.pagination?.pages || 0;
      const currentPage = response.pagination?.current || 1;
      const hasMore = currentPage < totalPages;
      
      setHasMore(hasMore);
      
      // Aggiorna lo stato di following per ogni utente, ma con più logging
      const newStatus = {};
      response[type].forEach(user => {
        // Verifica se l'utente corrente sta già seguendo questo utente
        const isFollowing = currentUser?.following?.some(followedId => 
          followedId === user._id || followedId?._id === user._id
        );
        
        newStatus[user._id] = currentUser?._id === user._id ? 'self' : 
                             (isFollowing ? 'following' : 'not-following');
        
      });
      
      setFollowingStatus(prev => {
        const updated = {...prev, ...newStatus};
        return updated;
      });
    } catch (err) {
      console.error(`❌ Errore nel caricamento dei ${type}:`, err);
      setError(`Errore nel caricamento degli ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // Modifica loadMore per evitare cicli
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage);
  }, [loading, hasMore, page, type, userId]);

  useEffect(() => {
    // Reset dello stato quando si apre il modal o cambia tipo
    if (show) {
      // Resetta lo stato solo quando si apre il modal o cambia tipo
      if (page === 1) {
        setUsers([]);
        setHasMore(true);
        setLoading(true);
        
       
        
        fetchUsers(1); 
      }
    }
  }, [show, type, userId]);

  // Modifica la funzione handleFollowToggle per evitare il problema 400
  const handleFollowToggle = async (targetUserId) => {
    try {
      setFollowLoading(prev => [...prev, targetUserId]);
      
      // Determina lo stato corrente nel FRONTEND
      const currentStatus = followingStatus[targetUserId]; 
      const isCurrentlyFollowing = currentStatus === 'following';
      
    
      
      // Aggiorna UI immediatamente (ottimistic update)
      setFollowingStatus(prev => ({
        ...prev, 
        [targetUserId]: isCurrentlyFollowing ? 'not-following' : 'following'
      }));
      
      try {
        // Esegui la chiamata API in base allo stato UI attuale
        if (isCurrentlyFollowing) {
          await unfollowUser(targetUserId);
        } else {
          await followUser(targetUserId);
          console.log(`✅ Iniziato a seguire ${targetUserId}`);
        }
        
        // Notifica il componente parent del cambio avvenuto con successo
        if (onFollowStatusChange) {
          onFollowStatusChange(targetUserId, !isCurrentlyFollowing);
        }
      } catch (error) {
        // In caso di errore, ripristina lo stato UI precedente
        console.error("❌ Errore API:", error);
        setFollowingStatus(prev => ({...prev, [targetUserId]: currentStatus}));
        
        // Mostra errore in UI
        toast.error("Errore nell'operazione. Riprova più tardi.");
      }
    } catch (error) {
      console.error("Errore generale nella gestione del follow:", error);
    } finally {
      setFollowLoading(prev => prev.filter(id => id !== targetUserId));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        {error ? (
          <div className="text-center py-4 text-danger">
            <p>{error}</p>
          </div>
        ) : (
          <div className="follow-list">
            {users.map(user => (
              <div key={user._id} className="follow-item p-3 d-flex align-items-center border-bottom">
                <Image 
                  src={user.profilePicture || 'https://via.placeholder.com/40'} 
                  roundedCircle 
                  width={50} 
                  height={50}
                  className="me-3"
                />
                
                <div className="flex-grow-1">
                  <div className="fw-bold">{user.firstName} {user.lastName}</div>
                  <div className="text-muted">@{user.username}</div>
                </div>
                
                {followingStatus[user._id] !== 'self' && (
                  <Button 
                    variant={followingStatus[user._id] === 'following' ? "outline-primary" : "primary"}
                    size="sm"
                    onClick={() => handleFollowToggle(user._id)}
                    disabled={followLoading.includes(user._id)}
                  >
                    {followLoading.includes(user._id) ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      followingStatus[user._id] === 'following' ? 'Smetti di seguire' : 'Segui'
                    )}
                  </Button>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="text-center py-3">
                <Spinner animation="border" role="status" variant="primary">
                  <span className="visually-hidden">Caricamento...</span>
                </Spinner>
              </div>
            )}
            
            {!loading && hasMore && (
              <div className="text-center py-3">
                <Button variant="outline-primary" onClick={loadMore}>
                  Carica altri
                </Button>
              </div>
            )}
            
            {!loading && !hasMore && users.length > 0 && (
              <div className="text-center py-3 text-muted">
                <p className="mb-0">Non ci sono altri {title.toLowerCase()} da mostrare</p>
              </div>
            )}
            
            {!loading && users.length === 0 && (
              <div className="text-center py-4">
                <p className="mb-0">Nessun {title.toLowerCase()} trovato</p>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Chiudi</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Follow;