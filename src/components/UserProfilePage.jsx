/* src/components/UserProfilePage.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Image, Button, Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom'; // Aggiungi useParams
import EditUserModal from './EditUserModal';
import Follow from './Follow';
import PostModal from './PostModal';
import CreatePostModal from './CreatePostModal';
import { updateProfilePicture, getUserById, getUserByUsername } from '../api/UserAPI'; // Aggiungi getUserByUsername
import { getPosts, getUserPosts } from '../api/PostAPI'; // Aggiungi getUserPosts
import '../index.css';
import { toast } from 'react-toastify';
import popingImage from '../popping.png';

const DEFAULT_VIDEOS = Array.from({ length: 6 }).map((_, i) => ({ 
  id: `default-video-${i}`, // Aggiungi ID unico per risolvere warning key
  url: `https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_5mb.mp4`,
  likeCount: Math.floor(Math.random() * 100),
  commentCount: Math.floor(Math.random() * 20) 
}));

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export default function UserProfilePage({ user: propUser }) {
  // Ottieni username dall'URL, ma mantieni compatibilità con le props
  const { username } = useParams();
  const navigate = useNavigate();
  const authContext = useAuth();
  const { currentUser, setCurrentUser } = useAuth();
  
  const [showEdit, setShowEdit] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [formData, setFormData] = useState({ name: '', bio: '' });
  const [data, setData] = useState(propUser || currentUser);
  const [userPosts, setUserPosts] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const postsRef = useRef(null);
  const videosRef = useRef(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Stati per gestire la visualizzazione
  const [visiblePosts, setVisiblePosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPostCount, setTotalPostCount] = useState(0);
  const loadMoreRef = useRef(null);
  
  useEffect(() => {
    // Se abbiamo già un utente dalle props, non facciamo nulla
    if (propUser) return;
    
    // Se abbiamo un username dall'URL e non abbiamo dati utente o i dati non corrispondono all'username
    if (username && (!data || data.username !== username)) {
      const loadUserData = async () => {
        try {
          // Se l'username corrisponde all'utente corrente, usiamo quei dati
          if (currentUser && username === currentUser.username) {
            setData(currentUser);
          } else {
            // Altrimenti carichiamo l'utente dall'API direttamente
            const userData = await getUserByUsername(username);
            if (userData) {
              setData(userData);
              
              // Aggiorna i contatori immediatamente con i dati freschi
              setFollowersCount(userData.followers?.length || 0);
              setFollowingCount(userData.following?.length || 0);
              console.log(`🧮 Contatori aggiornati da API: Followers=${userData.followers?.length || 0}, Following=${userData.following?.length || 0}`);
            } else {
              navigate('/');
              toast.error("Utente non trovato");
            }
          }
        } catch (error) {
          console.error("Errore nel caricamento profilo:", error);
          // Non reindirizzare se c'è un errore, mostriamo un toast
          toast.error("Impossibile caricare il profilo");
        }
      };
      
      loadUserData();
    }
  }, [username, currentUser, propUser, data]);

  useEffect(() => {
    if (!data) return;
    
    setFormData({ 
      name: data.username || data.firstName || 'Utente',
      bio: data.bio || 'Nessuna biografia disponibile.'
    });
    
    setFollowersCount(data.followers?.length || 0);
    setFollowingCount(data.following?.length || 0);
    
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
  }, [data]);

  useEffect(() => {
    const loadInitialPosts = async () => {
      try {
        if (!data?._id) return;
        
        const response = await getUserPosts(data._id, 1, 20); // Aumenta a 20 per assicurarti di caricare tutti
        
        // Resto del codice invariato...
      } catch (error) {
        console.error('Errore nel caricamento dei post:', error);
      }
    };

    loadInitialPosts();
  }, [data?._id]);

  useEffect(() => {
    const loadPosts = async () => {
      if (!data?._id || !hasMore) return;
      
      try {
        const response = await getUserPosts(data._id, page, 16); // Carica 16 post per volta (2 righe)
        
        if (response.posts?.length) {
          if (page === 1) {
            setVisiblePosts(response.posts);
          } else {
            setVisiblePosts(prev => [...prev, ...response.posts]);
          }
          
          // Aggiorna il totale e verifica se ci sono altri post
          setTotalPostCount(response.pagination?.total || response.posts.length);
          setHasMore(response.pagination?.hasNextPage || false);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Errore nel caricamento dei post:', error);
      }
    };
    
    loadPosts();
  }, [data?._id, page]);

  useEffect(() => {
    // Solo se ci sono altri post da caricare
    if (!hasMore) return;
    
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
  }, [loadMoreRef, hasMore]);

  useEffect(() => {
    if (data) {
      // Usa i dati effettivi invece di incrementare/decrementare i contatori
      const followerCount = data.followers?.length || 0;
      const followingCount = data.following?.length || 0;
      
      console.log(`📈 RENDER CONTATORI: Followers=${followerCount}, Following=${followingCount}`);
      
      setFollowersCount(followerCount);
      setFollowingCount(followingCount);
    }
  }, [data]);
  
  if (!data) return null;
  
  const userProfile = {
    name: data.username || data.firstName || 'Utente',
    fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    profilePic: data.profilePicture || 'https://i.pravatar.cc/200',
    bio: data.bio || 'Nessuna biografia disponibile.',
    email: data.email || '',
    coins: data.coins || 0,
    referralLink: data.referralLink || '#',
    location: data.location || null,
    preferences: data.preferences || {},
    sellerRating: data.sellerRating || { average: 0, count: 0 },
    createdAt: data.createdAt || new Date()
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const updatedUser = await updateProfilePicture(file);
      
      if (typeof authContext.updateUser === 'function') {
        authContext.updateUser(updatedUser);
      }
      
      setData(prev => ({
        ...prev,
        profilePicture: updatedUser.profilePicture || updatedUser.user?.profilePicture
      }));
      
      toast.success("Immagine profilo aggiornata con successo!");
      
    } catch (error) {
      console.error("❌ Errore nell'aggiornamento dell'immagine profilo:", error);
      toast.error("Errore nell'aggiornamento dell'immagine profilo");
    }
  };

  const handleUserUpdated = (updatedUser) => {

    if (typeof authContext.updateUser === 'function') {
      authContext.updateUser(updatedUser);
    }
    
    // Assicurati che setData sostituisca completamente l'oggetto
    setData(updatedUser);
  };

  const handlePostCreated = (newPost) => {
    // Aggiorna la lista dei post con il nuovo post
    setVisiblePosts(prev => [newPost, ...(prev || [])]);
    setTotalPostCount(prev => prev + 1);
  };

  const handlePostDeleted = (postId) => {
    // Rimuovi il post dalla lista visibile
    setVisiblePosts(prev => prev.filter(p => p._id !== postId));
    
    // Aggiorna il conteggio totale
    setTotalPostCount(prev => Math.max(0, prev - 1));
  };

  const renderPostRows = () => {
    if (!visiblePosts || visiblePosts.length === 0) {
      return (
        <div className="text-center w-100 py-5">
          <p className="text-muted">Nessun post disponibile</p>
        </div>
      );
    }
    
    // Raggruppa i post in righe di 8
    const rows = [];
    for (let i = 0; i < visiblePosts.length; i += 8) {
      const rowPosts = visiblePosts.slice(i, i + 8);
      rows.push(
        <div key={`row-${i}`} className="carousel-row mb-4">
          {rowPosts.map(p => (
            <div 
              key={p._id} 
              className="item post-item"
              onClick={() => {
                // Apri il modal con tutto l'array completo
                setSelectedPost({
                  post: p,
                  // L'indice globale è importante per la navigazione
                  index: visiblePosts.findIndex(post => post._id === p._id)
                });
              }}
            >
              <div className="item-container">
                <Image 
                  src={p.cover} 
                  className="item-media" 
                  loading="lazy"
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
          ))}
        </div>
      );
    }
    
    return rows;
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
              
              <Card className="summary-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Followers</span>
                    <strong>{followersCount}</strong>
                  </div>
                  <a 
                    className="link" 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      console.log(`📊 Apertura modale Followers - Conteggio attuale: ${followersCount}`);
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
                    <strong>{followingCount}</strong>
                  </div>
                  <a 
                    className="link" 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      console.log(`📊 Apertura modale Following - Conteggio attuale: ${followingCount}`);
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
                      {currentUser?._id === data._id && (
                        <Button 
                          className="position-absolute change-avatar-btn" 
                          variant="dark"
                          size="sm"
                          title="Cambia immagine profilo"
                          onClick={() => document.getElementById('profile-pic-input').click()}
                          style={{ 
                            opacity: 0.85, 
                            borderRadius: "50%", 
                            width: "32px", 
                            height: "32px", 
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
                          }}
                        >
                          <i className="bi bi-camera-fill"></i>
                        </Button>
                      )}
                      <input 
                        type="file" 
                        id="profile-pic-input" 
                        style={{ display: 'none' }} 
                        accept="image/*"
                        onChange={handleProfilePictureChange}
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
                        
                        {currentUser?._id === data._id && (
                          <Button 
                            variant="link"
                            className="p-0"
                            onClick={() => setShowEdit(true)}
                            title="Modifica profilo"
                          >
                            <i className="bi bi-pencil-square" style={{ fontSize: "1.2rem" }}></i>
                          </Button>
                        )}
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
                        <h5 className="mb-0">About Me</h5>
                        <Button 
                          variant="link" 
                          className="p-0 text-primary" 
                          onClick={() => setShowMoreDetails(!showMoreDetails)}
                        >
                          <small>{showMoreDetails ? "Nascondi dettagli" : "Mostra dettagli"}</small>
                        </Button>
                      </div>
                      
                      <p className="name">{userProfile.fullName}</p>
                      <p className="bio">{userProfile.bio}</p>
                      
                      {showMoreDetails && (
                        <div className="additional-details mt-3">
                          {userProfile.email && (
                            <div className="detail-item">
                              <i className="bi bi-envelope me-2"></i>
                              <span>{userProfile.email}</span>
                            </div>
                          )}
                          
                          {userProfile.location?.address?.city && (
                            <div className="detail-item">
                              <i className="bi bi-geo-alt me-2"></i>
                              <span>
                                {userProfile.location.address.city}
                                {userProfile.location.address.country && `, ${userProfile.location.address.country}`}
                              </span>
                            </div>
                          )}
                          
                          {userProfile.preferences?.theme && (
                            <div className="detail-item">
                              <i className="bi bi-palette me-2"></i>
                              <span>Tema: {userProfile.preferences.theme === 'dark' ? 'Scuro' : 'Chiaro'}</span>
                            </div>
                          )}
                          
                          <div className="detail-item">
                            <i className="bi bi-calendar3 me-2"></i>
                            <span>Membro dal: {formatDate(userProfile.createdAt)}</span>
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
                      I tuoi Post
                      <Button 
                        variant="link" 
                        className="p-0 ms-2" 
                        style={{ fontSize: '1.25rem', color: '#007bff' }}
                        onClick={() => setShowCreatePost(true)}
                      >
                        <i className="bi bi-plus-circle"></i>
                      </Button>
                    </div>
                   
                  </h5>
                </Col>
              </Row>
              
              <div className="posts-container">
                {renderPostRows()}
                
                {/* Indicatore di caricamento/fine lista */}
                {hasMore ? (
                  <div ref={loadMoreRef} className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Caricamento...</span>
                    </div>
                  </div>
                ) : visiblePosts.length > 0 && (
                  <div className="text-center py-3">
                    <small className="text-muted">Hai visto tutti i post</small>
                  </div>
                )}
              </div>

              <Row className="mt-4">
                <Col md={12}>
                  <h5 className="d-flex align-items-center">
                    I tuoi Video
                    <Button 
                      variant="link" 
                      className="p-0 ms-2" 
                      style={{ fontSize: '1.25rem', color: '#007bff' }}
                    >
                      <i className="bi bi-plus-circle"></i>
                    </Button>
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
                        _id: data._id,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        username: data.username,
                        profilePicture: data.profilePicture
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
        
        <EditUserModal 
          show={showEdit}
          onHide={() => setShowEdit(false)}
          user={data}
          onUserUpdated={handleUserUpdated}
        />
        
        <Follow 
          show={showFollowers}
          onHide={() => {
            console.log(`🔄 Chiusura modale Followers`);
            setShowFollowers(false);
          }}
          userId={data?._id}
          type="followers"
          onFollowStatusChange={(targetUserId, isNowFollowing) => {
            console.log(`👤 Follow status changed in Followers modal: user=${targetUserId}, isNowFollowing=${isNowFollowing}`);
            
            // Aggiorna lo stato dell'utente corrente
            setData(prev => {
              if (!prev) return prev;
              
              // Aggiorna following dell'utente corrente
              return {
                ...prev,
                following: isNowFollowing 
                  ? [...(prev.following || []), targetUserId]
                  : (prev.following || []).filter(id => String(id) !== String(targetUserId))
              };
            });
            
            // Aggiorna anche direttamente currentUser per mantenerlo sincronizzato
            if (authContext.updateUser && currentUser) {
              const updatedUser = {
                ...currentUser,
                following: isNowFollowing
                  ? [...(currentUser.following || []), targetUserId]
                  : (currentUser.following || []).filter(id => String(id) !== String(targetUserId))
              };
              authContext.updateUser(updatedUser);
              
              // Aggiorna il conteggio following dell'utente corrente
              if (currentUser._id === data._id) {
                setFollowingCount(prev => isNowFollowing ? prev + 1 : Math.max(0, prev - 1));
              }
            }
          }}
        />
        
        <Follow 
          show={showFollowing}
          onHide={() => {
            console.log(`🔄 Chiusura modale Following`);
            setShowFollowing(false);
          }}
          userId={data?._id}
          type="following"
          onFollowStatusChange={(targetUserId, isNowFollowing) => {
            console.log(`👤 Follow status changed in Following modal: user=${targetUserId}, isNowFollowing=${isNowFollowing}`);
            
            // Aggiorna lo stato dell'utente visualizzato
            setData(prev => {
              if (!prev) return prev;
              
              // Se l'utente visualizzato è l'utente corrente, aggiorna il suo following
              return {
                ...prev,
                following: isNowFollowing 
                  ? [...(prev.following || []), targetUserId]
                  : (prev.following || []).filter(id => String(id) !== String(targetUserId))
              };
            });
            
            // Aggiorna anche direttamente currentUser se l'utente visualizzato è quello corrente
            if (data._id === currentUser?._id && authContext.updateUser) {
              const updatedUser = {
                ...currentUser,
                following: isNowFollowing
                  ? [...(currentUser.following || []), targetUserId]
                  : (currentUser.following || []).filter(id => String(id) !== String(targetUserId))
              };
              authContext.updateUser(updatedUser);
            }
            
            // Aggiorna il conteggio following in modo immediato
            setFollowingCount(prev => isNowFollowing ? prev + 1 : Math.max(0, prev - 1));
          }}
        />
        
        <PostModal 
          show={!!selectedPost}
          onHide={() => setSelectedPost(null)}
          post={selectedPost?.post}
          userPosts={visiblePosts}
          initialIndex={selectedPost?.index || 0}
          onCommentAdded={(postId, exactCount) => {
            // Aggiorna il conteggio commenti
            setVisiblePosts(prevPosts => {
              return prevPosts.map(p => {
                if (p._id === postId) {
                  return {...p, commentCount: exactCount};
                }
                return p;
              });
            });
          }}
          onPostDeleted={handlePostDeleted} // Aggiungi questa prop
        />

        <CreatePostModal
          show={showCreatePost}
          onHide={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      </Container>
    </Container>
  );
}