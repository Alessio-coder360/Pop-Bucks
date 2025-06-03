import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { likePost, unlikePost } from '../api/PostAPI';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Stessi colori usati nei commenti per coerenza
const tumblrBlue = '#001935';
const darkBlue = '#001224';

/**
 * Componente riutilizzabile per gestire le azioni sui post (like, unlike)
 */
export default function PostActions({ postId, likeCount = 0, commentCount = 0 }) {
  // Log di debug per vedere se i conteggi vengono ricevuti correttamente
  
  const { isLoggedIn, openRegistrationForm } = useAuth(); // Aggiorna questo
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Aggiorna il conteggio dei like quando le props cambiano
  useEffect(() => {
    setCurrentLikeCount(likeCount);
  }, [likeCount]);

  // Aggiungi controllo per postId che inizia con "sample-"
  const isSamplePost = postId && postId.startsWith('sample-');

  const handleLikeToggle = async () => {
    if (!isLoggedIn) {
      showLoginPrompt();
      return;
    }

    // Usa isSamplePost insieme agli altri controlli
    if (isProcessing || postId === 'placeholder-id' || isSamplePost) {
      if (isSamplePost) {
        console.log("⚠️ Non è possibile mettere like a post di esempio");
      }
      return;
    }
    
    try {
      setIsProcessing(true);
      
      if (isLiked) {
        await unlikePost(postId);
        setCurrentLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await likePost(postId);
        setCurrentLikeCount(prev => prev + 1);
      }
      
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Errore nell'aggiornamento del like:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Nuova implementazione completa di showLoginPrompt
  const showLoginPrompt = () => {
    setShowLoginModal(true);
  };

  return (
    <>
      {/* Aggiungi stile CSS per bottoni */}
      <style>{`
        .action-button {
          background-color: #001935 !important;
          color: white !important;
          border: 2px solid #b0b0b0 !important; /* Bordo grigio invece di bianco */
          transition: all 0.2s ease-in-out;
        }
        
        .action-button:hover {
          background-color: white !important;
          color: #001935 !important;
          border-color: #001935 !important;
        }
      `}</style>

      <div className="p-2 border-0">
        {/* Debug dei dati like e commenti */}
        
        <div className="d-flex justify-content-between mb-1">
          <span className="d-flex align-items-center">
            <i className="bi bi-hand-thumbs-up-fill text-primary me-1" style={{fontSize: '16px'}}></i> 
            <span style={{color: 'white', fontWeight: 'bold'}}>{currentLikeCount || 0}</span>
          </span>
          <span style={{color: 'white'}}>{commentCount || 0} commenti</span>
        </div>

        {/* Modifica l'HR per renderlo più spesso */}
        <hr className="my-2" style={{borderWidth: '2px', opacity: '1'}} />
        
        <div className="d-flex justify-content-between">
          <Button 
            size="sm" 
            className="p-1 flex-grow-1 me-2 action-button" // Usa la nuova classe
            onClick={isLoggedIn ? handleLikeToggle : showLoginPrompt}
            disabled={isProcessing}
          >
            <i className="bi bi-hand-thumbs-up me-1"></i>
            <span className="small">Mi piace</span>
          </Button>
          
          <Button 
            size="sm" 
            className="p-1 flex-grow-1 action-button" // Usa la nuova classe
            onClick={isLoggedIn ? null : showLoginPrompt}
          >
            <i className="bi bi-chat-left-text me-1"></i>
            <span className="small">Commenta</span>
          </Button>
        </div>
      </div>

      {/* Modal di login */}
      <Modal 
        show={showLoginModal} 
        onHide={() => setShowLoginModal(false)} 
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
          <Button variant="secondary" onClick={() => setShowLoginModal(false)}>
            Annulla
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              // Usa localStorage invece di sessionStorage che è più affidabile tra le pagine
              localStorage.setItem('loginRedirectPath', '/main1');
              setShowLoginModal(false);
              navigate('/login');
            }}
            style={{backgroundColor: tumblrBlue, borderColor: darkBlue}}
          >
            Accedi ora
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => {
              setShowLoginModal(false); // Chiudi il modal
              openRegistrationForm(); // Apri il form di registrazione senza cambiare route
            }}
          >
            Registrati
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}