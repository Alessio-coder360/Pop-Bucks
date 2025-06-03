/* src/components/VisitPageUser.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Image, Card, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import Follow from './Follow';
import PostModal from './PostModal';
import { getUserById, followUser, unfollowUser } from '../api/UserAPI';
import { getUserPosts } from '../api/PostAPI';
import { toast } from 'react-toastify';
import '../index.css';

const DEFAULT_VIDEOS = Array.from({ length: 6 }).map((_, i) => ({ 
  id: `default-video-${i}`,
  url: `https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_5mb.mp4`,
  likeCount: Math.floor(Math.random() * 100),
  commentCount: Math.floor(Math.random() * 20) 
}));

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export default function VisitPageUser() {
  // Ottieni userId dall'URL
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, ...authContext } = useAuth();
  
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const postsRef = useRef(null);
  const videosRef = useRef(null);

  const [visiblePosts, setVisiblePosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); 
  const [totalPostCount, setTotalPostCount] = useState(0);
  const loadMoreRef = useRef(null);
  
  // Carica i dati dell'utente visitato
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Se si sta tentando di visitare il proprio profilo, reindirizza a /profile
        if (currentUser && userId === currentUser._id) {
          navigate('/profile');
          return;
        }
        
        // Controlla che userId sia valido
        if (!userId || userId === 'undefined') {
          console.error("❌ userId non valido:", userId);
          toast.error("ID utente non valido");
          navigate('/');
          return;
        }
        
        const userData = await getUserById(userId);
        
        // Controlla che i dati siano stati ricevuti
        if (userData && (userData.user || userData._id)) {
          // Gestisci sia il caso in cui la risposta è { user: {...} } che {...}
          setProfileData(userData.user || userData);
        } else {
          console.error("❌ Dati utente non validi:", userData);
          toast.error("Utente non trovato");
          navigate('/');
        }
      } catch (error) {
        console.error("❌ Errore nel caricamento profilo visitato:", error);
        toast.error("Impossibile caricare il profilo");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, currentUser, navigate]);

  // Gestisce lo scroll automatico dei caroselli
  useEffect(() => {
    if (!profileData) return;
    
    const scrollLoop = (el) => {
      if (!el) return null;
      return setInterval(() => {
        if (el && !el.matches(':hover')) {
          el.scrollLeft = (el.scrollLeft + 1) % el.scrollWidth;
        }
      }, 20);
    };
    
    const pInt = scrollLoop(postsRef.current);
    const vInt = scrollLoop(videosRef.current);
    
    return () => { 
      if (pInt) clearInterval(pInt); 
      if (vInt) clearInterval(vInt); 
    };
  }, [profileData]);

  // Carica i post dell'utente visitato
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!profileData?._id || !hasMore) return;
      
      try {
        setIsLoading(page === 1); // Mostra loading solo per la prima pagina
        
        const response = await getUserPosts(profileData._id, page, 20); // Carica 20 post per volta
        
        if (response && response.posts?.length) {
          
          // Aggiorna i post visibili
          if (page === 1) {
            setVisiblePosts(response.posts);
            setUserPosts(response.posts); // Per compatibilità con il codice esistente
          } else {
            setVisiblePosts(prev => [...prev, ...response.posts]);
            setUserPosts(prev => [...prev, ...response.posts]); // Per compatibilità
          }
          
          // Aggiorna il contatore totale e verifica se ci sono altre pagine
          setTotalPostCount(response.pagination?.total || response.posts.length);
          setHasMore(response.pagination?.hasNextPage || false);
        } else {
          setHasMore(false);
          if (page === 1) {
            setVisiblePosts([]);
            setUserPosts([]);
          }
        }
      } catch (error) {
        console.error('❌ Errore nel recupero dei post utente:', error);
        if (page === 1) {
          setVisiblePosts([]);
          setUserPosts([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPosts();
  }, [profileData?._id, page]);

  // Aggiungi questo useEffect per l'IntersectionObserver
  useEffect(() => {
    if (!hasMore) return; // Non osservare se non ci sono più post
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );
    
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, profileData]);

  // Determina lo stato iniziale di follow
  useEffect(() => {
    if (currentUser && profileData) {
      // Verifica se l'utente corrente sta già seguendo questo profilo
      const alreadyFollowing = currentUser.following?.some(
        id => id === profileData._id || id?._id === profileData._id
      );
      setIsFollowing(alreadyFollowing);
    }
  }, [currentUser, profileData]);

  // Gestisce il toggle del follow
  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.info("Effettua l'accesso per seguire questo utente");
      navigate('/login');
      return;
    }

    try {
      setFollowLoading(true);
      
      // Ottieni lo stato attuale prima di qualsiasi modifica
      const wasFollowing = isFollowing;
      const newIsFollowing = !wasFollowing;
      
      // PARTE 1: Aggiornamento ottimistico dell'UI
      // Mostra immediatamente il cambiamento all'utente
      setIsFollowing(newIsFollowing);
      
      // Aggiorna il contatore dei followers dell'utente visitato
      setProfileData(prev => ({
        ...prev,
        followersCount: newIsFollowing 
          ? (prev.followersCount || 0) + 1 
          : Math.max(0, (prev.followersCount || 0) - 1)
      }));
      
      // PARTE 2: Aggiorna il contesto dell'utente corrente (following)
      // Questo è fondamentale per aggiornare la card in UserProfilePage
      if (authContext.updateUser) {
        const updatedCurrentUser = { ...currentUser };
        
        // Aggiorna la lista following dell'utente corrente
        if (newIsFollowing) {
          // Aggiungi l'utente visitato alla lista following dell'utente corrente
          updatedCurrentUser.following = [
            ...(updatedCurrentUser.following || []), 
            profileData._id
          ];
          updatedCurrentUser.followingCount = (updatedCurrentUser.followingCount || 0) + 1;
        } else {
          // Rimuovi l'utente visitato dalla lista following dell'utente corrente
          updatedCurrentUser.following = (updatedCurrentUser.following || [])
            .filter(id => String(id) !== String(profileData._id) && 
                   String(id?._id) !== String(profileData._id));
          updatedCurrentUser.followingCount = Math.max(0, (updatedCurrentUser.followingCount || 0) - 1);
        }
        
        // Aggiorna il contesto globale dell'utente
        authContext.updateUser(updatedCurrentUser);
      }
      
      // PARTE 3: Chiama l'API per rendere persistente la modifica
      try {
        if (newIsFollowing) {
          await followUser(profileData._id);
          toast.success(`Ora segui ${profileData.username}`);
        } else {
          await unfollowUser(profileData._id);
          toast.success(`Hai smesso di seguire ${profileData.username}`);
        }
      } catch (apiError) {
        console.error("Errore API follow/unfollow:", apiError);
        
        // Se l'API fallisce, ripristina lo stato precedente
        setIsFollowing(wasFollowing);
        
        setProfileData(prev => ({
          ...prev,
          followersCount: wasFollowing 
            ? (prev.followersCount || 0) + 1 
            : Math.max(0, (prev.followersCount || 0) - 1)
        }));
        
        if (authContext.updateUser) {
          const rollbackUser = { ...currentUser };
          if (wasFollowing) {
            rollbackUser.following = [
              ...(rollbackUser.following || []).filter(id => 
                String(id) !== String(profileData._id) && 
                String(id?._id) !== String(profileData._id)),
              profileData._id
            ];
          } else {
            rollbackUser.following = (rollbackUser.following || [])
              .filter(id => String(id) !== String(profileData._id) && 
                     String(id?._id) !== String(profileData._id));
          }
          
          authContext.updateUser(rollbackUser);
        }
        
        toast.error("Si è verificato un errore. Riprova più tardi.");
      }
    } catch (error) {
      console.error("Errore generale:", error);
      toast.error("Errore durante l'operazione");
    } finally {
      setFollowLoading(false);
    }
  };
  
  // Mostra spinner durante il caricamento
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento profilo...</span>
        </div>
      </div>
    );
  }
  
  if (!profileData) return null;
  
  const userProfile = {
    name: profileData.username || profileData.firstName || 'Utente',
    fullName: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
    profilePic: profileData.profilePicture || 'https://i.pravatar.cc/200',
    bio: profileData.bio || 'Nessuna biografia disponibile.',
    email: profileData.email || '',
    followersCount: profileData.followers?.length || 0,
    followingCount: profileData.following?.length || 0,
    coins: profileData.coins || 0,
    referralLink: profileData.referralLink || '#',
    location: profileData.location || null,
    preferences: profileData.preferences || {},
    sellerRating: profileData.sellerRating || { average: 0, count: 0 },
    createdAt: profileData.createdAt || new Date()
  };

  return (
    <Container fluid className="user-profile-page p-0">
      <Container className="user-profile-container mt-4">
        <Container>
          <Row>
            <Col lg={2} className="mt-4">
            <Button className="story-btn w-100 mb-4">
                            <div className="d-flex align-items-center justify-content-center">
                              <i className="bi bi-film me-2" style={{ fontSize: '1.2rem' }}></i>
                              <span></span>
                              <span className="coming-soon-badge ms-2">Coming Soon</span>
                            </div>
                          </Button>
              {/* Solo visualizzazione dei contatori, senza bottone "Create Story" */}
              <Card className="summary-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Followers</span>
                    <strong>{userProfile.followersCount}</strong>
                  </div>
                  <a 
                    className="link" 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowFollowers(true);
                    }}
                  >
                    Vedi tutti
                  </a>
                </Card.Body>
              </Card>
              
              <Card className="summary-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Following</span>
                    <strong>{userProfile.followingCount}</strong>
                  </div>
                  <a 
                    className="link" 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowFollowing(true);
                    }}
                  >
                    Vedi tutti
                  </a>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={10} className="mt-4">
              <Row>
                <Col md={12}>
                  <div className="profile-section">
                    <div className="avatar-wrapper position-relative">
                      <Image 
                        src={userProfile.profilePic} 
                        roundedCircle 
                        className="avatar" 
                        style={{ 
                          border: "4px solid white", 
                          boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                          borderRadius: "50%"
                        }}
                      />
                    </div>
                    
                    <div className="info">
                      <div className="row1 d-flex align-items-center">
                        <h2 style={{ 
                          fontFamily: "'Poppins', sans-serif", 
                          fontWeight: "600",
                          background: "linear-gradient(45deg, #1a73e8, #8833ff)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          marginBottom: 0,
                          marginRight: "15px"
                        }}>
                          {userProfile.name}
                        </h2>
                        <button 
                          className={`btn ${isFollowing ? 'btn-outline-primary' : 'btn-primary'} ms-3`} 
                          onClick={handleFollowToggle} 
                          disabled={followLoading}
                        >
                          {followLoading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : isFollowing ? (
                            <><i className="bi bi-person-check me-1"></i>Segui già</>
                          ) : (
                            <><i className="bi bi-person-plus me-1"></i>Segui</>
                          )}
                        </button>
                      </div>
                      
                      <div className="bio-text mt-2" style={{ 
                        fontSize: "1rem", 
                        color: "#555", 
                        maxWidth: "500px", 
                        lineHeight: "1.6"
                      }}>
                        {userProfile.bio}
                      </div>
                    </div>
                  </div>
                </Col>
                
                <Col md={12} className="mt-4">
                  <Card className="about-card">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">About {userProfile.name}</h5>
                        <a 
                          href="#" 
                          className="text-primary" 
                          onClick={(e) => {
                            e.preventDefault();
                            setShowMoreDetails(!showMoreDetails);
                          }}
                        >
                          <small>{showMoreDetails ? "Nascondi dettagli" : "Mostra dettagli"}</small>
                        </a>
                      </div>
                      
                      <p className="name">{userProfile.fullName}</p>
                      <p className="bio">{userProfile.bio}</p>
                      
                      {showMoreDetails && (
                        <div className="additional-details mt-3">
                          {userProfile.location?.address?.city && (
                            <div className="detail-item">
                              <i className="bi bi-geo-alt me-2"></i>
                              <span>
                                {userProfile.location.address.city}
                                {userProfile.location.address.country && `, ${userProfile.location.address.country}`}
                              </span>
                            </div>
                          )}
                          <div className="detail-item">
                            <i className="bi bi-calendar3 me-2"></i>
                            <span>Membro da: {formatDate(userProfile.createdAt)}</span>
                          </div>
                          <div className="detail-item">
                            <i className="bi bi-star me-2"></i>
                            <span>Valutazione venditore: {userProfile.sellerRating?.average || 'N/A'} ({userProfile.sellerRating?.count || 0} recensioni)</span>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="mt-4">
                <Col md={12}>
                  <h5 className="d-flex align-items-center justify-content-between">
                    <div>
                      Post di {userProfile.name}
                    </div>
                    {totalPostCount > 0 && (
                      <small className="text-muted">
                        {visiblePosts.length} di {totalPostCount} post
                      </small>
                    )}
                  </h5>
                </Col>
              </Row>
              
              <div className="posts-container">
                <div className="carousel-row mb-5" ref={postsRef}>
                  {visiblePosts && visiblePosts.length > 0 ? (
                    visiblePosts.map(p => (
                      <div 
                        key={p._id} 
                        className="item post-item"
                        onClick={() => setSelectedPost(p)}
                      >
                        <div className="item-container">
                          <Image 
                            src={p.cover} 
                            className="item-media" 
                            loading="lazy" // Aggiungi lazy loading per ottimizzare
                            style={{ height: "240px", objectFit: "cover" }}
                          />
                          <div className="item-overlay">
                            <div className="item-stats">
                              <div className="item-stat">
                                <i className="bi bi-heart-fill text-danger"></i>
                                <span>{p.likeCount || p.likes?.length || 0}</span>
                              </div>
                              <div className="item-stat">
                                <i className="bi bi-chat-fill text-primary"></i>
                                <span>{p.commentCount !== undefined ? p.commentCount : (p.comments?.length || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center w-100 py-5">
                      <p className="text-muted">Nessun post disponibile</p>
                    </div>
                  )}
                </div>
                
                {hasMore ? (
                  <div ref={loadMoreRef} className="text-center py-3 mb-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Caricamento...</span>
                    </div>
                  </div>
                ) : visiblePosts.length > 0 && (
                  <div className="text-center py-3 mb-4">
                    <small className="text-muted">Hai visto tutti i post</small>
                  </div>
                )}
              </div>

              <Row className="mt-4">
                <Col md={12}>
                  <h5 className="d-flex align-items-center">
                    Video di {userProfile.name}
                    <div className="coming-soon-badge ms-2">Coming Soon</div>
                  </h5>
                </Col>
              </Row>
              
              <div className="carousel-row mb-5" ref={videosRef}>
                {DEFAULT_VIDEOS.map(v => (
                  <div 
                    key={v.id} 
                    className="item video-item"
                    onClick={() => setSelectedPost({
                      _id: `video-${v.id}`,
                      cover: `https://picsum.photos/seed/video${v.id}/800/600`,
                      content: `Questo è un video di esempio #${v.id + 1}`,
                      author: {
                        _id: profileData._id,
                        firstName: profileData.firstName,
                        lastName: profileData.lastName,
                        username: profileData.username,
                        profilePicture: profileData.profilePicture
                      },
                      likeCount: v.likeCount,
                      commentCount: v.commentCount,
                      createdAt: new Date().toISOString(),
                      tags: ['video', `esempio${v.id}`]
                    })}
                  >
                    <div className="item-container">
                      <video src={v.url} className="item-media" />
                      <i className="bi bi-play-circle-fill video-play-button"></i>
                      <div className="item-overlay">
                        <div className="item-stats-container">
                          <div className="item-stat">
                            <i className="bi bi-heart-fill text-danger"></i>
                            <span>{v.likeCount}</span>
                          </div>
                          <div className="item-stat">
                            <i className="bi bi-chat-fill text-primary"></i>
                            <span>{v.commentCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="coming-soon-overlay">
                      <div className="coming-soon-text">Coming Soon</div>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
        
        {/* Rimosso EditUserModal */}
        
        <Follow 
          show={showFollowers}
          onHide={() => setShowFollowers(false)}
          userId={profileData._id}
          type="followers"
          currentUserId={currentUser?._id} // Per impedire di seguire se stessi
        />
        
        <Follow 
          show={showFollowing}
          onHide={() => setShowFollowing(false)}
          userId={profileData._id}
          type="following"
          currentUserId={currentUser?._id} // Per impedire di seguire se stessi
        />
        
        <PostModal 
          show={!!selectedPost}
          onHide={() => setSelectedPost(null)}
          post={selectedPost}
          userPosts={visiblePosts || []} // Usa visiblePosts invece di userPosts
          onCommentAdded={(postId, exactCount) => {
            // Aggiorna il conteggio commenti nello stato locale
            setVisiblePosts(prevPosts => {
              const updatedPosts = [...prevPosts];
              const postIndex = updatedPosts.findIndex(p => p._id === postId);
              
              if (postIndex !== -1) {
                updatedPosts[postIndex] = {
                  ...updatedPosts[postIndex],
                  commentCount: exactCount
                };
              }
              
              return updatedPosts;
            });
            
            // Mantieni anche l'aggiornamento di userPosts per compatibilità
            setUserPosts(prevPosts => {
              const updatedPosts = [...prevPosts];
              const postIndex = updatedPosts.findIndex(p => p._id === postId);
              
              if (postIndex !== -1) {
                updatedPosts[postIndex] = {
                  ...updatedPosts[postIndex],
                  commentCount: exactCount
                };
              }
              
              return updatedPosts;
            });
            
            if (selectedPost && selectedPost._id === postId) {
              setSelectedPost(prev => ({
                ...prev,
                commentCount: exactCount
              }));
            }
          }}
        />
        
        {/* Rimosso CreatePostModal */}
      </Container>
    </Container>
  );
}