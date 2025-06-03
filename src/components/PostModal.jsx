import React, { useState, useEffect } from 'react';
import { Modal, Button, Image, Row, Col } from 'react-bootstrap';
import { getPostLikes, getPostComments, deletePost } from '../api/PostAPI';
import { useAuth } from '../context/AuthContext';
import AddComAndLikeMyPost from './AddComAndLikeMyPost';
import { toast } from 'react-toastify';

const PostModal = ({ show, onHide, post, userPosts = [], onCommentAdded, onPostDeleted }) => {
  const { isLoggedIn, currentUser } = useAuth();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [displayedPost, setDisplayedPost] = useState(null);
  const [initialPostId, setInitialPostId] = useState(null);
  const [blockReset, setBlockReset] = useState(false);
  const [loadedPosts, setLoadedPosts] = useState({});
  const [loadingPostIds, setLoadingPostIds] = useState([]);

  const getTotalCommentsCount = (commentsList) => {
    if (!commentsList || !Array.isArray(commentsList)) return 0;
    
    let totalCount = 0;
    
    totalCount = commentsList.length;
    
    commentsList.forEach(comment => {
      if (comment.replies && Array.isArray(comment.replies)) {
        totalCount += comment.replies.length;
      }
    });
    
    return totalCount;
  };

  useEffect(() => {
    if (!show) {
      setBlockReset(false);
      return;
    }
    
    if (show && post && !displayedPost) {
      setInitialPostId(post._id);
      
      if (userPosts.length > 0) {
        const index = userPosts.findIndex(p => p._id === post._id);
        setCurrentPostIndex(index >= 0 ? index : 0);
      }
      
      setDisplayedPost(post);
      return;
    }
    
    if (blockReset && displayedPost && displayedPost._id !== post._id) {
      return;
    }
    
    if (show && post && !blockReset && displayedPost?._id !== post._id) {
      setDisplayedPost(post);
      
      if (userPosts.length > 0) {
        const index = userPosts.findIndex(p => p._id === post._id);
        setCurrentPostIndex(index >= 0 ? index : 0);
      }
    }
  }, [show, post, userPosts, displayedPost, blockReset]);

  useEffect(() => {
    if (show && displayedPost?._id) {
      loadPostData(displayedPost._id);
    }
  }, [show, displayedPost?._id]);

  const loadPostData = async (postId) => {
    if (loadingPostIds.includes(postId)) {
      return;
    }
    
    if (loadedPosts[postId]) {
      setLikes(loadedPosts[postId].likes);
      setComments(loadedPosts[postId].comments);
      return;
    }
    
    setLoading(true);
    setLoadingPostIds(prev => [...prev, postId]);
    
    try {
      const [likesResponse, commentsResponse] = await Promise.all([
        getPostLikes(postId),
        getPostComments(postId)
      ]);
      
      const likesData = likesResponse.users || [];
      const commentsData = commentsResponse.comments || [];
      
      setLikes(likesData);
      setComments(commentsData);
      
      setLoadedPosts(prev => ({
        ...prev,
        [postId]: { 
          likes: likesData, 
          comments: commentsData,
          timestamp: Date.now()
        }
      }));
      
    } catch (error) {
      console.error(`❌ Errore caricamento dati per ${postId}:`, error);
    } finally {
      setLoading(false);
      setLoadingPostIds(prev => prev.filter(id => id !== postId));
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const navigatePost = (direction) => {
    if (!userPosts.length || userPosts.length <= 1) return;
    
    setBlockReset(true);
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentPostIndex + 1) % userPosts.length;
    } else {
      newIndex = (currentPostIndex - 1 + userPosts.length) % userPosts.length;
    }
    
    const oldId = displayedPost?._id;
    const newId = userPosts[newIndex]?._id;
    
    setCurrentPostIndex(newIndex);
    setDisplayedPost(userPosts[newIndex]);
  };

  const handleCommentAdded = React.useCallback((newComment) => {
    setBlockReset(true);
    
    const currentPostId = displayedPost._id;
    
    setComments(prevComments => {
      const updatedComments = [newComment, ...prevComments];
      
      const exactCommentCount = getTotalCommentsCount(updatedComments);
      
      setDisplayedPost(prev => ({
        ...prev,
        commentCount: exactCommentCount
      }));
      
      setLoadedPosts(prev => {
        if (prev[currentPostId]) {
          return {
            ...prev,
            [currentPostId]: {
              ...prev[currentPostId],
              comments: updatedComments
            }
          };
        }
        return prev;
      });
      
      if (onCommentAdded) {
        onCommentAdded(currentPostId, exactCommentCount);
      }
      
      return updatedComments;
    });
  }, [displayedPost, onCommentAdded]);

  const handleCommentChanged = React.useCallback((updatedComments) => {
    setComments(updatedComments);
  }, []);

  const handleCommentDeleted = React.useCallback((commentId, isReply, parentCommentId) => {
    const currentPostId = displayedPost?._id;
    if (!currentPostId) return;
    
    setComments(prevComments => {
      const updatedComments = isReply && parentCommentId
        ? prevComments.map(c => {
            if (c._id === parentCommentId && c.replies) {
              return {
                ...c,
                replies: c.replies.filter(r => r._id !== commentId)
              };
            }
            return c;
          })
        : prevComments.filter(c => c._id !== commentId);
      
      const exactCommentCount = getTotalCommentsCount(updatedComments);
      
      setDisplayedPost(prev => ({
        ...prev,
        commentCount: exactCommentCount
      }));
      
      setLoadedPosts(prev => {
        if (prev[currentPostId]) {
          return {
            ...prev,
            [currentPostId]: {
              ...prev[currentPostId],
              comments: updatedComments
            }
          };
        }
        return prev;
      });
      
      if (onCommentAdded) {
        onCommentAdded(currentPostId, exactCommentCount);
      }
      
      return updatedComments;
    });
  }, [displayedPost, loadedPosts, onCommentAdded]);

  const handleDeletePost = async (postId) => {
    if (window.confirm("Sei sicuro di voler eliminare questo post? Questa azione non può essere annullata.")) {
      try {
        await deletePost(postId);
        
        onHide();
        
        if (typeof onPostDeleted === 'function') {
          onPostDeleted(postId);
        }
        
        toast.success("Post eliminato con successo");
      } catch (error) {
        console.error("Errore durante l'eliminazione del post:", error);
        toast.error("Errore durante l'eliminazione del post");
      }
    }
  };

  const likesComponent = React.useMemo(() => (
    <div className="like-list flex-grow-1" style={{overflowY: 'auto', maxHeight: '60vh'}}>
      {likes.length > 0 ? (
        likes.map((user, index) => (
          <div key={user._id || `like-${index}`} className="d-flex align-items-center mb-2 p-2 border-bottom">
            <Image 
              src={user.profilePicture || 'https://i.pravatar.cc/40'} 
              roundedCircle 
              width={40} 
              height={40}
              className="me-2"
              loading="lazy"
            />
            <div>
              <div className="fw-bold">{user.firstName} {user.lastName}</div>
              <div className="small text-muted">@{user.username}</div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-muted text-center">Nessun like ancora</p>
      )}
    </div>
  ), [likes]);

  if (!displayedPost) return null;

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered 
      dialogClassName="post-modal-custom"
    >
      <Modal.Header closeButton>
        <Modal.Title>{displayedPost.author?.username || 'Utente'}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        <Row className="g-0">
          <Col md={3} className="border-end" style={{height: '80vh', overflowY: 'auto'}}>
            <div className="p-3 d-flex flex-column h-100">
              <h5 className="mb-3">
                <i className="bi bi-heart-fill text-danger me-2"></i>
                {likes.length} {likes.length === 1 ? 'Like' : 'Likes'}
              </h5>
              
              {likesComponent}
              
              {userPosts.length > 1 && (
                <div className="mt-auto text-center py-3">
                  <Button 
                    variant="outline-primary" 
                    className="rounded-pill px-4"
                    onClick={() => navigatePost('prev')}
                  >
                    <i className="bi bi-chevron-left me-2"></i> 
                    Post precedente
                  </Button>
                </div>
              )}
            </div>
          </Col>
          
          <Col md={6} className="position-relative">
            <div className="post-author d-flex align-items-center p-3 border-bottom">
              <Image 
                src={displayedPost.author?.profilePicture || 'https://i.pravatar.cc/40'} 
                roundedCircle
                width={40}
                height={40}
                className="me-3"
              />
              <div className="flex-grow-1">
                <div className="fw-bold">{displayedPost.author?.firstName} {displayedPost.author?.lastName}</div>
                <div className="text-muted">@{displayedPost.author?.username}</div>
              </div>
              
              {currentUser && displayedPost.author && currentUser._id === displayedPost.author._id && (
                <Button 
                  variant="link" 
                  className="text-dark p-0" 
                  onClick={() => handleDeletePost(displayedPost._id)}
                >
                  <i className="bi bi-trash" style={{ fontSize: '1.2rem' }}></i>
                </Button>
              )}
            </div>
            
            <div style={{height: '65vh', overflow: 'hidden'}}>
              <Image 
                src={displayedPost.cover || 'https://i.pravatar.cc/800'} 
                className="w-100 h-100"
                style={{objectFit: 'cover'}}
              />
            </div>
            
            <div className="p-3">
              <p className="mb-1">{displayedPost.content}</p>
              <p className="text-muted small">
                {new Date(displayedPost.createdAt).toLocaleDateString()} · 
                {displayedPost.hashtags?.map((tag, index) => (
                  <span key={index} className="badge bg-light text-dark mx-1">#{tag}</span>
                ))}
              </p>
              
              {userPosts.length > 1 && (
                <div className="text-center mt-2">
                  <small className="text-muted">
                    Post {currentPostIndex + 1} di {userPosts.length}
                  </small>
                </div>
              )}
            </div>
          </Col>
          
          <Col md={3} className="d-flex flex-column border-start" style={{height: '80vh'}}>
            <div className="p-3 d-flex flex-column h-100">
              <h5 className="mb-3 sticky-top bg-white pt-2 pb-2">
                <i className="bi bi-chat-left-text-fill me-2"></i>
                {comments.length} Commenti
              </h5>
              
              <div className="flex-grow-1 overflow-auto">
                <AddComAndLikeMyPost 
                  postId={displayedPost._id}
                  comments={comments}
                  onCommentAdded={handleCommentAdded}
                  onCommentChanged={handleCommentChanged}
                  onCommentDeleted={handleCommentDeleted}
                />
              </div>
              
              {userPosts.length > 1 && (
                <div className="mt-3 text-center py-3 sticky-bottom bg-white">
                  <Button 
                    variant="outline-primary" 
                    className="rounded-pill px-4"
                    onClick={() => navigatePost('next')}
                  >
                    Post successivo
                    <i className="bi bi-chevron-right ms-2"></i>
                  </Button>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Modal.Body>
      
      <style>
        {`
          .post-modal-custom {
            max-width: 95%;
          }
        `}
      </style>
    </Modal>
  );
};

export default PostModal;