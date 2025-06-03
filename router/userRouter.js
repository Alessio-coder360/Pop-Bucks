import {Router} from 'express'; 
import { getUsers,
   getUserById,
  getUserByUsername, searchUsers,
  getSellerReviews,
  createUser,
  updateUser, 
  followUser,
  unfollowUser, 
  getUserFollowers, 
  getUserFollowing,
  loginUser,
  updateStoreBanner,
  refreshAccessToken,
  removeStoreBanner,
  updateProfilePicture,
  setupUserStore
} from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { uploadmulterCloudinary } from '../middlewares/upload.js';

const userRouter = Router();

// Rotte pubbliche - non richiedono autenticazione

// !quello che accade: 

// Spiegazione del flusso:
// 1. La richiesta arriva a POST /api/v3/posts/
// 2. Express passa la richiesta al middleware authMiddleware
// 3. authMiddleware verifica il token e aggiunge req.user
// 4. Se tutto è ok, authMiddleware chiama next() e la richiesta passa a createPost
// 5. createPost può ora accedere a req.user per sapere chi sta creando il post


userRouter.post('/register', uploadmulterCloudinary.single('profile'), createUser);
userRouter.post('/login', loginUser);
userRouter.post('/refresh-token', refreshAccessToken);

// Rotte protette - richiedono autenticazione
userRouter.use('/me', authMiddleware); // Applica auth a tutte le rotte /me/*
userRouter.get('/me', getUsers);
// ! rimuovere a fine progetto tutta riga 36 getuserbyname 
userRouter.get('/by-username/:username', authMiddleware, getUserByUsername);
userRouter.get('/search', authMiddleware, searchUsers);
userRouter.put('/me/profile', updateUser);
userRouter.put('/me/store-banner', uploadmulterCloudinary.single('banner'), updateStoreBanner);
userRouter.delete('/me/store-banner', removeStoreBanner);
userRouter.put('/me/profile-picture', uploadmulterCloudinary.single('profile'), updateProfilePicture);
userRouter.post('/me/store-setup', setupUserStore);

// Rotte per accesso a utenti specifici
userRouter.get('/:id', authMiddleware, getUserById);
userRouter.get('/:sellerId/reviews', authMiddleware, getSellerReviews);
//userRouter.delete('/:id', authMiddleware, deleteUser);

// Rotte per relazioni sociali
userRouter.post('/:id/follow', authMiddleware, followUser);
userRouter.delete('/:id/follow', authMiddleware, unfollowUser);
userRouter.get('/:id/followers', authMiddleware, getUserFollowers);
userRouter.get('/:id/following', authMiddleware, getUserFollowing);

export default userRouter;




