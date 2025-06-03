import { Router } from 'express';
import { getPublicPosts, getPublicPostComments, getPublicCommentReplies } from '../controllers/publicController.js';

const publicRouter = Router();

// Solo la rotta per recuperare i post per la homepage
publicRouter.get('/posts', getPublicPosts);


publicRouter.get('/posts/:postId/comments', getPublicPostComments);

publicRouter.get('/posts/comments/:commentId/replies', getPublicCommentReplies);

export default publicRouter;