import React, { useState, useEffect } from 'react';
import { ListGroup, Image, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getTrendingUsers } from '../api/UserAPI';

export default function BrochureUsers() {
  const { isLoggedIn, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Aggiungi un piccolo ritardo per dare tempo al token di essere disponibile
    const timer = setTimeout(() => {
      fetchTrendingUsers();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  const fetchTrendingUsers = async () => {
    try {
      setLoading(true);
      
      // Se siamo sicuri che l'utente è loggato, fa la chiamata API
      if (isLoggedIn) {
        const users = await getTrendingUsers(4);
        if (users && users.length > 0) {
          setTrendingUsers(users);
          return;
        }
      }
      
      // Fallback ai dati hardcoded se non abbiamo dati reali
      setTrendingUsers([
        { _id: '680173ca7052c986fa00b401', username: 'Gostoso1', firstName: 'Gostoso', lastName: 'Carrieri', profilePicture: 'https://res.cloudinary.com/dvn75hdwh/image/upload/v1745508819/users/profiles/1745508818302-___.jpg' },
        { _id: '680173ca7052c986fa00b402', username: 'ChefMaster', firstName: 'Mario', lastName: 'Rossi', profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg' },
        { _id: '680173ca7052c986fa00b403', username: 'TravelBlogger', firstName: 'Laura', lastName: 'Bianchi', profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg' },
        { _id: '680173ca7052c986fa00b404', username: 'PhotoGuru', firstName: 'Marco', lastName: 'Verdi', profilePicture: 'https://randomuser.me/api/portraits/men/67.jpg' }
      ]);
    } catch (error) {
      console.error("Errore nel recupero degli utenti di tendenza:", error);
      
      // Usa i fallback in caso di errore
      setTrendingUsers([
        { _id: '680173ca7052c986fa00b401', username: 'Gostoso1', firstName: 'Gostoso', lastName: 'Carrieri', profilePicture: 'https://res.cloudinary.com/dvn75hdwh/image/upload/v1745508819/users/profiles/1745508818302-___.jpg' },
        { _id: '680173ca7052c986fa00b402', username: 'ChefMaster', firstName: 'Mario', lastName: 'Rossi', profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg' },
        { _id: '680173ca7052c986fa00b403', username: 'TravelBlogger', firstName: 'Laura', lastName: 'Bianchi', profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg' },
        { _id: '680173ca7052c986fa00b404', username: 'PhotoGuru', firstName: 'Marco', lastName: 'Verdi', profilePicture: 'https://randomuser.me/api/portraits/men/67.jpg' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitProfile = (userId) => {
    // Usa currentUser già ottenuto a livello di componente
    if (currentUser && userId === currentUser._id) {
      navigate(`/profile/${userId}`);
    } else {
      navigate(`/visit/${userId}`);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#001224',
        borderRadius: '8px',
        padding: '1rem',
        color: '#fff',
        marginTop: location.pathname.includes('/marketplace') ? '0' : '70px',
        position: 'sticky',
        top: '100px'
      }}
    >
      <h5 className="mb-3">POP-BUCKERS DI TENDENZA</h5>

      <ListGroup variant="flush">
        {loading ? (
          <div className="text-center p-3">
            <div className="spinner-border spinner-border-sm text-light" role="status">
              <span className="visually-hidden">Caricamento...</span>
            </div>
          </div>
        ) : (
          trendingUsers.map((user, index) => (
            <React.Fragment key={user._id}>
              <ListGroup.Item
                style={{ backgroundColor: 'transparent', border: 'none', padding: '0.5rem 0' }}
              >
                <div className="d-flex align-items-center">
                  <Image
                    src={user.profilePicture || `https://picsum.photos/seed/user${index}/32/32`}
                    roundedCircle
                    width={32}
                    height={32}
                    className="me-2 flex-shrink-0"
                    alt={user.username}
                  />
                  <div className="flex-grow-1 text-truncate me-2">
                    <div style={{ fontWeight: '500', color: 'white' }} className="text-truncate">{user.username}</div>
                    <small className="text-truncate d-block text-white">{user.firstName} {user.lastName}</small>
                  </div>
                  <div className="flex-shrink-0">
                    <Button 
                      variant="outline-info" 
                      size="sm"
                      onClick={() => handleVisitProfile(user._id)}
                    >
                      Visita
                    </Button>
                  </div>
                </div>
              </ListGroup.Item>
              {index < trendingUsers.length - 1 && (
                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />
              )}
            </React.Fragment>
          ))
        )}
      </ListGroup>
    </div>
  );
}