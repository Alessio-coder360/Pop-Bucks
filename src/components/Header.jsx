// c) Menu dropdown stile mobile per profilo utente

// Trova il dropdown del profilo e sostituiscilo nella versione mobile
<div className="d-md-none">
  <Dropdown>
    <Dropdown.Toggle 
      variant="link" 
      id="dropdown-mobile"
      className="p-0 d-flex align-items-center"
      style={{ color: 'white', textDecoration: 'none' }}
    >
      <Image 
        src={currentUser?.profilePicture || 'https://via.placeholder.com/40'} 
        width={32} 
        height={32} 
        roundedCircle 
        className="border border-2 border-light" 
      />
    </Dropdown.Toggle>
    <Dropdown.Menu align="end" className="mobile-dropdown">
      <div className="px-3 py-2 border-bottom">
        <div className="d-flex align-items-center">
          <Image 
            src={currentUser?.profilePicture || 'https://via.placeholder.com/40'} 
            width={50} 
            height={50}
            roundedCircle 
            className="me-3" 
          />
          <div>
            <p className="fw-bold mb-0">{`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`}</p>
            <small className="text-muted">Vedi il tuo profilo</small>
          </div>
        </div>
      </div>
      <Dropdown.Item onClick={() => navigate(`/profile/${currentUser?._id}`)}>
        <i className="bi bi-person me-2"></i> Profilo
      </Dropdown.Item>
      <Dropdown.Item onClick={() => navigate('/settings')}>
        <i className="bi bi-gear me-2"></i> Impostazioni
      </Dropdown.Item>
      <Dropdown.Item onClick={logout}>
        <i className="bi bi-box-arrow-right me-2"></i> Logout
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>
</div>