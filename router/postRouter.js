import { Router } from 'express';
import {
  getPosts, getUserPosts, getPostById, createPost, createVideo, updatePost, updatePostCover,
  deletePost, likePost, unlikePost, getPostComments, getUserVideos, getTrendingVideos, addComment,
  updateComment, deleteComment, likeComment,unlikeComment,// viewPost
  getPostLikes
} from '../controllers/postController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';
import { isPostAuthor } from '../middlewares/authMiddleware.js';
import { uploadmulterCloudinary } from '../middlewares/upload.js'; // Corretto: importazione con {}

const postRouter = Router();

// Rotte pubbliche per visualizzazione
postRouter.get('/', authMiddleware, getPosts);
postRouter.get('/user/:id', authMiddleware, getUserPosts);
postRouter.get('/:id', authMiddleware, getPostById);
postRouter.get('/:id/comments', authMiddleware, getPostComments);

postRouter.get('/user/:id/videos', authMiddleware, getUserVideos);
postRouter.get('/videos/trending', authMiddleware, getTrendingVideos);

// Rotte che richiedono autenticazione
postRouter.post('/', authMiddleware, uploadmulterCloudinary.single('cover'), createPost);
postRouter.post('/video', authMiddleware, uploadmulterCloudinary.single('video'), createVideo);

// postRouter.post('/:id/view', authMiddleware, viewPost);
postRouter.put('/:id', authMiddleware, isPostAuthor, uploadmulterCloudinary.single("cover"), updatePost);
postRouter.put('/:id/cover', authMiddleware, isPostAuthor, uploadmulterCloudinary.single("cover"), updatePostCover);
postRouter.delete('/:id', authMiddleware, isPostAuthor, deletePost); 

// Interazioni
postRouter.get('/:id/likes', authMiddleware, getPostLikes); // Aggiunto per ottenere i like
postRouter.post('/:id/like', authMiddleware, likePost);
postRouter.delete('/:id/like', authMiddleware, unlikePost);
postRouter.post('/:id/comments', authMiddleware, addComment);
postRouter.patch('/comments/:id', authMiddleware, updateComment);
postRouter.delete('/comments/:id', authMiddleware, deleteComment);


// Aggiungi queste rotte per like/unlike dei commenti
postRouter.post('/comments/:id/like', authMiddleware, likeComment);
postRouter.delete('/comments/:id/like', authMiddleware, unlikeComment);

export default postRouter;


