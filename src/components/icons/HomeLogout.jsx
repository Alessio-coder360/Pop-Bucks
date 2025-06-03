// src/components/Main.jsx
import Home from '../../components/Home';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Image, Carousel, Button, Form, Modal } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { getPublicPosts } from '../../api/PostAPI';
import PostActions from '../../componentsActions/PostActions';
import CommentsSection from '../../componentsActions/CommentsSection';
import { useNavigate } from 'react-router-dom';

/**
 * Utility per generare URL affidabili per immagini profilo
 * @param {Object} author - Oggetto autore con profilePicture e username
 * @return {string} URL dell'immagine profilo
 */
const getProfileImageUrl = (author) => {
  if (!author) return 'https://i.pravatar.cc/40?img=1';
  if (!author.profilePicture) return `https://i.pravatar.cc/40?img=${author.username?.charCodeAt(0) % 70 || 1}`;
  
  // Se l'URL inizia con /uploads/ aggiungi il base URL
  if (author.profilePicture.startsWith('/uploads/')) {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${author.profilePicture}`;
  }
  
  return author.profilePicture;
};

const tumblrBlue = '#001935';
const darkBlue = '#001224';
const deepPurple = '#3a1657';

export default function HomeLogout() {
  const { isLoggedIn, openRegistrationForm } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [showEhiPopperModal, setShowEhiPopperModal] = useState(false);
  const navigate = useNavigate();

  // Carica i post dal database solo quando l'utente non è loggato
  useEffect(() => {
    if (!isLoggedIn) {
      const fetchPosts = async () => {
        try {
          setLoading(true);
          // Usa getPublicPosts invece di getPosts
          const response = await getPublicPosts();
          
          if (response && response.posts && response.posts.length > 0) {
            // Mescola i post per mostrarli in ordine casuale
            const shuffledPosts = [...response.posts].sort(() => 0.5 - Math.random());
            setPosts(shuffledPosts);
          } else {
            console.warn("⚠️ Nessun post pubblico trovato");
            setError("Nessun post trovato");
            // Usa i placeholder se necessario
            setPosts(generateSamplePosts(10));
          }
        } catch (err) {
          console.error("❌ Errore durante il recupero dei post pubblici:", err);
          setError("Errore nel caricamento dei post");
          // Usa post di esempio in caso di errore
          setPosts(generateSamplePosts(10));
        } finally {
          setLoading(false);
        }
      };
      
      fetchPosts();
    }
  }, [isLoggedIn]);

  // Aggiungi questa funzione helper se non è già presente
  const generateSamplePosts = (count) => {
    return Array(count).fill().map((_, i) => ({
      _id: `sample-post-${i}`,
      title: `Post di esempio ${i+1}`,
      content: `Questo è un post di esempio per il test. Contenuto del post #${i+1}`,
      cover: `https://picsum.photos/seed/post${i}/800/600`,
      author: {
        _id: `sample-user-${i}`,
        firstName: `Nome${i}`,
        lastName: `Cognome${i}`,
        username: `utente_${i}`,
        profilePicture: `https://picsum.photos/seed/user${i}/100/100`
      },
      likeCount: Math.floor(Math.random() * 100),
      commentCount: Math.floor(Math.random() * 20),
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
    }));
  };

  if (isLoggedIn) {
    return <Home />;  // Ora usa il componente Home invece di FacebookStylePosts
  }
  // Immagini per il carosello (mantenuto identico all'originale)
  const carouselCards = [
    {id: 10, title: 'Carousel #1'},
    {id: 11, title: 'Carousel #2'},
    {id: 12, title: 'Carousel #3'},
    {id: 13, title: 'Carousel #4'},
    {id: 14, title: 'Carousel #5'},
    {id: 15, title: 'Carousel #6'},
    {id: 16, title: 'Carousel #7'},
    {id: 17, title: 'Carousel #8'},
    {id: 18, title: 'Carousel #9'}
  ];
  
  // Crea gruppi di 4 card per il carosello (mantenuto identico all'originale)
  const carouselGroups = [];
  for (let i = 0; i < carouselCards.length; i += 4) {
    carouselGroups.push(carouselCards.slice(i, i + 4));
  }

  // Versione ottimizzata di getPostData che non causa loop
  const getPostData = (index, field, defaultValue) => {
    // VERSIONE PULITA E OTTIMIZZATA
    if (!posts || index >= posts.length) return defaultValue;
    if (posts[index][field] === undefined) return defaultValue;
    return field === 'likeCount' || field === 'commentCount' 
      ? Number(posts[index][field]) 
      : posts[index][field];
  };

  // Helper per ottenere i dati dell'autore o utilizzare i valori predefiniti se mancanti
  const getAuthorData = (index, field, defaultValue) => {
    // VERSIONE PULITA E OTTIMIZZATA
    if (!posts || index >= posts.length || !posts[index].author) return defaultValue;
    return posts[index].author[field] !== undefined ? posts[index].author[field] : defaultValue;
  };

  // Helper per formattare la data in formato relativo (es: "2h fa")
  const formatDate = (dateString, defaultValue) => {
    if (!dateString) return defaultValue;
    
    try {
      const postDate = new Date(dateString);
      const now = new Date();
      const diffMs = now - postDate;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) return "Adesso";
      if (diffHours < 24) return `${diffHours}h`;
      if (diffHours < 48) return "Ieri";
      return `${Math.floor(diffHours / 24)} giorni fa`;
    } catch (err) {
      console.error("Errore nel parsing della data:", err);
      return defaultValue;
    }
  };
  
  // Se l'utente NON è loggato, mostra layout diverso per desktop e mobile
  return (
    <Container fluid className="p-2 px-1">
      {/* DESKTOP & TABLET: Layout a griglia */}
      <div className="d-none d-md-block">
        {/* PRIMA RIGA */}
        <Row className="mt-5">
          {/* Colonna SINISTRA: 4 card piccole */}
          <Col lg={7}>
            <Row className="g-2">
              {[0, 1, 2, 3].map((idx) => (
                <Col xs={6} className="pb-0" key={idx}>
                  <Card className="h-100 p-0 facebook-post" style={{ 
                    borderRadius: '8px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Header stile Facebook */}
                    <Card.Header className="bg-white p-2 d-flex align-items-center border-0">
                      <Image 
                        src={getProfileImageUrl(posts[idx]?.author || {
                          username: `user${idx+1}`, 
                          profilePicture: `https://picsum.photos/seed/user${idx+1}/40/40`
                        })}
                        width={32} 
                        height={32}
                        roundedCircle 
                        className="me-2" 
                      />
                      <div>
                        <div className="fw-bold small mb-0">
                          {getAuthorData(idx, 'firstName', `User`)} {getAuthorData(idx, 'lastName', `Name ${idx+1}`)}
                        </div>
                        <small className="text-muted">
                          {formatDate(getPostData(idx, 'createdAt', null), `${3+idx}h`)}
                        </small>
                      </div>
                      <div className="ms-auto">
                        <i className="bi bi-three-dots"></i>
                      </div>
                    </Card.Header>
                    
                    {/* Mini contenuto */}
                    <Card.Body className="p-2 pt-0 pb-0">
                      {getPostData(idx, 'content', `Questo è un post interessante #${idx+1}`).length > 100 ? (
                        <>
                          <p className="small mb-1">
                            {expandedPosts[idx] 
                              ? getPostData(idx, 'content', `Questo è un post interessante #${idx+1}`) 
                              : getPostData(idx, 'content', `Questo è un post interessante #${idx+1}`).substring(0, 100) + '...'}
                          </p>
                          <button 
                            className="btn btn-link p-0 text-decoration-none" 
                            onClick={() => isLoggedIn 
                              ? setExpandedPosts(prev => ({...prev, [idx]: !prev[idx]}))
                              : setShowEhiPopperModal(true)
                            }
                          >
                            {expandedPosts[idx] ? 'Mostra meno' : 'Leggi tutto'}
                          </button>
                        </>
                      ) : (
                        <p className="small mb-1">
                          {getPostData(idx, 'content', `Questo è un post interessante #${idx+1}`)}
                        </p>
                      )}
                    </Card.Body>
                    
                    {/* Immagine esistente - DIMENSIONE MANTENUTA */}
                    <div style={{ height: '260px', overflow: 'hidden', padding: 0 }}>
                      <Card.Img
                        variant="top"
                        src={getPostData(idx, 'cover', `https://picsum.photos/seed/card${idx}/400/400`)}
                        alt={getPostData(idx, 'title', `Card ${idx + 1}`)}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    </div>
                    
                    {/* Footer stile Facebook CON DIVISORE MIGLIORATO */}
                    <Card.Footer className="p-0 d-flex flex-column" style={{ flexGrow: 0 }}>
                      <PostActions 
                        postId={getPostData(idx, '_id', 'placeholder-id')} 
                        likeCount={Number(getPostData(idx, 'likeCount', 0))}
                        commentCount={Number(getPostData(idx, 'commentCount', 0))}
                      />
                      <div className="comments-container" style={{ 
                        maxHeight: '150px', 
                        overflowY: 'auto',
                        position: 'relative'
                      }}>
                        <CommentsSection 
                          postId={getPostData(idx, '_id', 'placeholder-id')}
                          comments={getPostData(idx, 'comments', [])}
                        />
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>

          {/* Colonna DESTRA: 1 card grande */}
          <Col lg={5} className="pb-0">
            <Card className="h-100 p-0 facebook-post" style={{ 
              borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header stile Facebook */}
              <Card.Header className="bg-white p-2 d-flex align-items-center border-0">
                <Image 
                  src={getProfileImageUrl(posts[4]?.author || {
                    username: `userBig1`, 
                    profilePicture: `https://picsum.photos/seed/userBig1/40/40`
                  })}
                  width={40} 
                  height={40}
                  roundedCircle 
                  className="me-2" 
                />
                <div>
                  <div className="fw-bold mb-0">
                    {getAuthorData(4, 'username', "Pagina Ufficiale")}
                  </div>
                  <small className="text-muted">
                    {formatDate(getPostData(4, 'createdAt', null), "2h")} · <i className="bi bi-globe2"></i>
                  </small>
                </div>
                <div className="ms-auto">
                  <i className="bi bi-three-dots"></i>
                </div>
              </Card.Header>
              
              {/* Contenuto */}
              <Card.Body className="p-2 pt-0 pb-0">
                <p className="mb-0">
                  {getPostData(4, 'content', "Ecco la nostra nuova immagine di copertina! Cosa ne pensate? Fateci sapere nei commenti")}
                </p>
              </Card.Body>

              {/* Aggiungi uno spazio minimo tra il contenuto e l'immagine */}
              <div style={{ marginTop: '0.5rem' }}></div>
              
              {/* Immagine esistente - DIMENSIONE RIDOTTA */}
              <div style={{ 
                height: '600px', // Altezza fissa a esattamente 600px
                overflow: 'hidden', 
                padding: 0,
                flexGrow: 0,      // Impedisce all'immagine di espandersi
                flexShrink: 0     // Impedisce all'immagine di ridursi
              }}>
                <Card.Img
                  variant="top"
                  src={getPostData(4, 'cover', "https://picsum.photos/seed/bigcard/800/800")}
                  alt={getPostData(4, 'title', "Card grande")}
                  style={{ 
                    objectFit: 'cover', 
                    width: '100%', 
                    height: '100%' 
                  }}
                />
              </div>
              
              {/* Footer stile Facebook */}
              <Card.Footer className="p-0 d-flex flex-column" style={{ flexGrow: 0 }}>
                <PostActions 
                  postId={getPostData(4, '_id', 'placeholder-id')} 
                  likeCount={Number(getPostData(4, 'likeCount', 0))}
                  commentCount={Number(getPostData(4, 'commentCount', 0))}
                />
                <div className="comments-container" style={{ 
                  maxHeight: '150px', 
                  overflowY: 'auto',
                  position: 'relative'
                }}>
                  <CommentsSection 
                    postId={getPostData(4, '_id', 'placeholder-id')}
                    comments={getPostData(4, 'comments', [])}
                  />
                </div>
              </Card.Footer>
            </Card>
          </Col>
        </Row>

        {/* SECONDA RIGA */}
        <Row className="g-2 mt-2">
          {/* Colonna SINISTRA: 1 card grande */}
          <Col lg={5} className="pb-0">
            <Card className="h-100 p-0 facebook-post" style={{ 
              borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header stile Facebook */}
              <Card.Header className="bg-white p-2 d-flex align-items-center border-0">
                <Image 
                  src={getProfileImageUrl(posts[5]?.author || {
                    username: `userBig2`, 
                    profilePicture: `https://picsum.photos/seed/userBig2/40/40`
                  })}
                  width={40} 
                  height={40}
                  roundedCircle 
                  className="me-2" 
                />
                <div>
                  <div className="fw-bold mb-0">
                    {getAuthorData(5, 'username', "Pop-Bucks Official")}
                  </div>
                  <small className="text-muted">
                    {formatDate(getPostData(5, 'createdAt', null), "5h")} · <i className="bi bi-globe2"></i>
                  </small>
                </div>
                <div className="ms-auto">
                  <i className="bi bi-three-dots"></i>
                </div>
              </Card.Header>
              
              {/* Contenuto */}
              <Card.Body className="p-2 pt-0 pb-0">
                <p className="mb-0">
                  {getPostData(5, 'content', "Nuova immagine del nostro team! Cosa ne pensate del nostro nuovo ufficio?")}
                </p>
              </Card.Body>
              
              {/* Immagine esistente - DIMENSIONE MANTENUTA */}
              <div style={{ 
                height: '600px', // Modificato da 650px a 600px per uniformità
                overflow: 'hidden', 
                padding: 0,
                flexGrow: 0,
                flexShrink: 0
              }}>
                <Card.Img
                  variant="top"
                  src={getPostData(5, 'cover', "https://picsum.photos/seed/bigcard2/800/800")}
                  alt={getPostData(5, 'title', "Card grande 2")}
                  style={{ 
                    objectFit: 'cover', 
                    width: '100%', 
                    height: '100%' 
                  }}
                />
              </div>
              
              {/* Footer stile Facebook */}
              <Card.Footer className="p-0 d-flex flex-column" style={{ flexGrow: 0 }}>
                <PostActions 
                  postId={getPostData(5, '_id', 'placeholder-id')} 
                  likeCount={Number(getPostData(5, 'likeCount', 0))}
                  commentCount={Number(getPostData(5, 'commentCount', 0))}
                />
                <div className="comments-container" style={{ 
                  maxHeight: '150px', 
                  overflowY: 'auto',
                  position: 'relative'
                }}>
                  <CommentsSection 
                    postId={getPostData(5, '_id', 'placeholder-id')}
                    comments={getPostData(5, 'comments', [])}
                  />
                </div>
              </Card.Footer>
            </Card>
          </Col>

          {/* Colonna DESTRA: 4 card piccole */}
          <Col lg={7}>
            <Row className="g-2">
              {[6, 7, 8, 9].map((idx, i) => (
                <Col xs={6} className="pb-0" key={idx}>
                  <Card className="h-100 p-0 facebook-post" style={{ 
                    borderRadius: '8px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Header stile Facebook */}
                    <Card.Header className="bg-white p-2 d-flex align-items-center border-0">
                      <Image 
                        src={getProfileImageUrl(posts[idx]?.author || {
                          username: `user${i+5}`, 
                          profilePicture: `https://picsum.photos/seed/user${i+5}/40/40`
                        })}
                        width={32} 
                        height={32}
                        roundedCircle 
                        className="me-2" 
                      />
                      <div>
                        <div className="fw-bold small mb-0">
                          {getAuthorData(idx, 'firstName', `User`)} {getAuthorData(idx, 'lastName', `Name ${i+5}`)}
                        </div>
                        <small className="text-muted">
                          {formatDate(getPostData(idx, 'createdAt', null), `${i+2}h`)}
                        </small>
                      </div>
                      <div className="ms-auto">
                        <i className="bi bi-three-dots"></i>
                      </div>
                    </Card.Header>
                    
                    {/* Mini contenuto */}
                    <Card.Body className="p-2 pt-0 pb-0">
                      {getPostData(idx, 'content', `Ho appena scoperto questo progetto interessante #${i+5}`).length > 100 ? (
                        <>
                          <p className="small mb-1">
                            {expandedPosts[idx] 
                              ? getPostData(idx, 'content', `Ho appena scoperto questo progetto interessante #${i+5}`) 
                              : getPostData(idx, 'content', `Ho appena scoperto questo progetto interessante #${i+5}`).substring(0, 100) + '...'}
                          </p>
                          <button 
                            className="btn btn-link p-0 text-decoration-none" 
                            onClick={() => isLoggedIn 
                              ? setExpandedPosts(prev => ({...prev, [idx]: !prev[idx]}))
                              : setShowEhiPopperModal(true)
                            }
                          >
                            {expandedPosts[idx] ? 'Mostra meno' : 'Leggi tutto'}
                          </button>
                        </>
                      ) : (
                        <p className="small mb-1">
                          {getPostData(idx, 'content', `Ho appena scoperto questo progetto interessante #${i+5}`)}
                        </p>
                      )}
                    </Card.Body>
                    
                    {/* Immagine esistente - DIMENSIONE MANTENUTA */}
                    <div style={{ height: '230px', overflow: 'hidden', padding: 0 }}>
                      <Card.Img
                        variant="top"
                        src={getPostData(idx, 'cover', `https://picsum.photos/seed/card${i+4}/400/400`)}
                        alt={getPostData(idx, 'title', `Card piccola ${i + 5}`)}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    </div>
                    
                    {/* Footer stile Facebook */}
                    <Card.Footer className="p-0 d-flex flex-column" style={{ flexGrow: 0 }}>
                      <PostActions 
                        postId={getPostData(idx, '_id', 'placeholder-id')} 
                        likeCount={Number(getPostData(idx, 'likeCount', 0))}
                        commentCount={Number(getPostData(idx, 'commentCount', 0))}
                      />
                      <div className="comments-container" style={{ 
                        maxHeight: '150px', 
                        overflowY: 'auto',
                        position: 'relative'
                      }}>
                        <CommentsSection 
                          postId={getPostData(idx, '_id', 'placeholder-id')}
                          comments={getPostData(idx, 'comments', [])}
                        />
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>

        {/* TERZA RIGA: CAROSELLO */}
        <Row className="g-1 mt-3">
          <Col>
            <h5 className="mb-2 text-white">Potrebbe interessarti</h5>
            <Carousel 
              indicators={true} 
              controls={true}
              interval={5000}
              pause="hover"
              wrap={true}
            >
              {/* Crea due gruppi di 4 post ciascuno */}
              {[0, 1].map(groupIndex => (
                <Carousel.Item key={groupIndex}>
                  <Row className="g-2">
                    {posts.slice(groupIndex * 4, (groupIndex * 4) + 4).map((post, i) => (
                      <Col xs={3} key={i} className="pb-0">
                        <Card className="h-100 p-0" style={{ 
                          borderRadius: '8px', 
                          boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                          overflow: 'hidden',
                          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.15)';
                        }}
                        >
                          <div style={{ 
                            height: '150px', 
                            overflow: 'hidden', 
                            padding: 0,
                            position: 'relative'
                          }}>
                            <Card.Img
                              variant="top"
                              src={post?.cover || `https://picsum.photos/seed/carousel${i}/150/150`}
                              alt={post?.title || `Post suggerito ${i+1}`}
                              style={{ 
                                objectFit: 'cover', 
                                width: '100%', 
                                height: '100%',
                                transition: 'transform 0.3s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            />
                          </div>
                          <Card.Body className="p-2" style={{
                            backgroundColor: '#001935', 
                            color: 'white',
                            borderBottomLeftRadius: '8px',
                            borderBottomRightRadius: '8px'
                          }}>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="d-flex align-items-center">
                                <i className="bi bi-hand-thumbs-up me-1"></i>
                                <small style={{color: 'white'}}>{post?.likeCount || 0}</small>
                              </span>
                              <span className="d-flex align-items-center">
                                <i className="bi bi-chat-left me-1"></i>
                                <small style={{color: 'white'}}>{post?.commentCount || 0}</small>
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Carousel.Item>
              ))}
            </Carousel>
          </Col>
        </Row>
      </div>

      {/* TABLET: Layout personalizzato */}
      <div className="d-none d-md-block d-lg-none">
        {/* PRIMA RIGA: Card grande sopra, due piccole sotto */}
        <Row className="g-2 mb-2">
          {/* Card grande */}
          <Col xs={12}>
            <Card className="h-100 p-0 facebook-post" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Card.Header className="bg-white p-2 d-flex align-items-center border-0">
                <Image 
                  src={getProfileImageUrl(posts[0]?.author || {})}
                  width={40} 
                  height={40}
                  roundedCircle 
                  className="me-2" 
                />
                <div>
                  <div className="fw-bold mb-0">
                    {posts[0]?.author?.username || "Pagina Ufficiale"}
                  </div>
                  <small className="text-muted">
                    {formatDate(posts[0]?.createdAt, "2h")} · <i className="bi bi-globe2"></i>
                  </small>
                </div>
                <div className="ms-auto">
                  <i className="bi bi-three-dots"></i>
                </div>
              </Card.Header>
              
              <Card.Body className="p-2 pt-0 pb-0">
                <p className="mb-2">
                  {posts[0]?.content || "Ecco il nostro post principale!"}
                </p>
              </Card.Body>
              
              <div style={{ height: '450px', overflow: 'hidden', padding: 0 }}>
                <Card.Img
                  variant="top"
                  src={posts[0]?.cover || "https://picsum.photos/seed/bigcard/800/800"}
                  alt={posts[0]?.title || "Card grande"}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>
              
              <Card.Footer>
                <PostActions 
                  postId={posts[0]?._id || 'placeholder-id'} 
                  likeCount={Number(posts[0]?.likeCount || 0)}
                  commentCount={Number(posts[0]?.commentCount || 0)}
                />
                <CommentsSection 
                  postId={posts[0]?._id || 'placeholder-id'}
                  comments={posts[0]?.comments || []}
                />
              </Card.Footer>
            </Card>
          </Col>
          
          {/* Due card piccole sotto */}
          {[1, 2].map((idx) => (
            <Col xs={6} key={idx}>
              <Card className="h-100 p-0 facebook-post" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {/* Contenuto simile alle card piccole esistenti */}
                <Card.Header className="bg-white p-2 d-flex align-items-center border-0">
                  <Image 
                    src={getProfileImageUrl(posts[idx]?.author || {})}
                    width={32} 
                    height={32}
                    roundedCircle 
                    className="me-2" 
                  />
                  <div>
                    <div className="fw-bold small mb-0">
                      {posts[idx]?.author?.firstName || `User`} {posts[idx]?.author?.lastName || `Name ${idx}`}
                    </div>
                    <small className="text-muted">
                      {formatDate(posts[idx]?.createdAt, `${idx+1}h`)}
                    </small>
                  </div>
                  <div className="ms-auto">
                    <i className="bi bi-three-dots"></i>
                  </div>
                </Card.Header>
              </Card>
            </Col>
          ))}
        </Row>
        
        {/* SECONDA RIGA: Due card piccole sopra, una grande sotto */}
        <Row className="g-2">
          {/* Due card piccole sopra */}
          {[3, 4].map((idx) => (
            <Col xs={6} key={idx}>
              <Card className="h-100 p-0 facebook-post" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {/* Contenuto simile alle card piccole esistenti */}
              </Card>
            </Col>
          ))}
          
          {/* Card grande sotto */}
          <Col xs={12}>
            <Card className="h-100 p-0 facebook-post" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {/* Contenuto simile alla card grande esistente */}
            </Card>
          </Col>
        </Row>
      </div>

      {/* MOBILE: Layout a singola colonna */}
      <div className="d-md-none">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((idx, i) => {
          const postIndex = i % (posts.length || 1); // Evita divisione per zero se non ci sono post
          return (
            <Card key={idx} className="instagram-post mb-3 border-0">
              <Card.Header className="bg-white d-flex align-items-center border-0 pb-1">
                <Image 
                  src={getProfileImageUrl(posts[postIndex]?.author || {
                    username: `user${idx}`, 
                    profilePicture: `https://picsum.photos/seed/user${idx}/40/40`
                  })}
                  width={32} 
                  height={32}
                  roundedCircle 
                  className="me-2" 
                />
                <span className="fw-bold">
                  {getAuthorData(postIndex, 'username', `user_${idx}`)}
                </span>
                <div className="ms-auto">
                  <i className="bi bi-three-dots"></i>
                </div>
              </Card.Header>
              
              <div className="position-relative w-100" style={{ paddingBottom: '100%' }}>
                <Card.Img 
                  src={getPostData(postIndex, 'cover', `https://picsum.photos/seed/card${idx}/600/600`)}
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              
              <Card.Body className="pt-2 pb-1 px-2">
               
                
                <p className="fw-bold mb-1">
                  {getPostData(postIndex, 'likeCount', Math.floor(Math.random() * 200) + 10)} likes
                </p>
                
                <p className="mb-1">
                  <span className="fw-bold me-1">
                    {getAuthorData(postIndex, 'username', `user_${idx}`)}
                  </span>
                  <span>
                    {getPostData(postIndex, 'content', `Contenuto della card #${idx} in stile Instagram`)}
                  </span>
                </p>
                <p className="text-muted small">Visualizza tutti i commenti</p>
                <p className="text-muted small mb-0">
                  {formatDate(getPostData(postIndex, 'createdAt', null), 
                    idx < 3 ? 'OGGI' : idx < 5 ? 'IERI' : idx + ' GIORNI FA')}
                </p>
              </Card.Body>
            </Card>
          );
        })}
      </div>

      {/* Mostra un messaggio di caricamento o errore se necessario */}
      {loading && (
        <div className="text-center my-4">
          <p>Caricamento post in corso...</p>
        </div>
      )}
      {error && !loading && posts.length === 0 && (
        <div className="text-center my-4 text-danger">
          <p>{error}</p>
        </div>
      )}

      {/* Modale stile "Ehi Popper" */}
      <Modal 
        show={showEhiPopperModal} 
        onHide={() => setShowEhiPopperModal(false)} 
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
          <Button variant="secondary" onClick={() => setShowEhiPopperModal(false)}>
            Annulla
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              localStorage.setItem('returnPath', '/main1');
              setShowEhiPopperModal(false);
              navigate('/');
            }}
            style={{backgroundColor: tumblrBlue, borderColor: darkBlue}}
          >
            Accedi ora
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => {
              setShowEhiPopperModal(false); // Chiudi il modal
              openRegistrationForm(); // Apri il form di registrazione
            }}
          >
            Registrati
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}