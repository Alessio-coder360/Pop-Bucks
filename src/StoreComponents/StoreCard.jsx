import React, { useRef } from 'react';
import Tilt from 'react-parallax-tilt';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

export default function StoreCard({ store, onClick }) {
  const cardRef = useRef(null);
  const isVisible = useIntersectionObserver(cardRef, { threshold: 0.1 });
  
  // Determina la URL dell'immagine (per demo o banner caricato)
  const getImageUrl = () => {
    if (store.banner && store.banner[0] instanceof File) {
      return URL.createObjectURL(store.banner[0]);
    } else {
      const seedMap = {
        "elettronica": "tech",
        "abbigliamento": "fashion",
        "casa": "home"
      };
      const seed = seedMap[store.category] || "store";
      return `https://picsum.photos/seed/${seed}${store.id}/400/300`;
    }
  };

  return (
    <div ref={cardRef} style={{ width: '280px', minHeight: '240px' }}>
      {isVisible && (
        <Tilt 
          glareEnable={true} 
          glareMaxOpacity={0.3} 
          tiltMaxAngleX={10}
          tiltMaxAngleY={10}
          perspective={800}
        >
          <div
            onClick={() => onClick(store)}
            className="cursor-pointer bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform"
            style={{ 
              transition: 'transform 0.3s ease',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}
          >
            <div style={{ height: '180px', backgroundColor: '#f0f0f0' }}>
              <img 
                src={getImageUrl()} 
                alt={store.name}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
                loading="lazy" 
              />
            </div>
            <div style={{ padding: '16px 20px' }}>
              <h4 style={{ 
                marginBottom: '4px',
                fontSize: '22px',
                fontWeight: 'bold'
              }}>{store.name}</h4>
              <p style={{ 
                fontSize: '16px',
                color: '#666',
                textTransform: 'capitalize',
                marginBottom: '8px'
              }}>{store.category}</p>
              <div 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '12px'
                }}
              >
                <i className="bi bi-shop me-2 fs-5"></i>
                <span style={{ fontSize: '16px' }}>
                  {store.items?.length || 0} prodotti
                </span>
              </div>
            </div>
          </div>
        </Tilt>
      )}
      {!isVisible && (
        <div style={{ 
          width: '100%', 
          height: '280px', 
          background: '#f0f0f0', 
          borderRadius: '12px' 
        }}></div>
      )}
    </div>
  );
}
