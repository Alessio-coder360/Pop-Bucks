import { Router } from 'express';
import {
  getStories,              // Controller: ottiene storie recenti
  createStory,             // Controller: crea una nuova storia
  updateStory,
  getStoryById,            // Controller: ottiene una singola storia
  deleteStory,             // Controller: elimina una storia
  viewStory                // Controller: segna una storia come visualizzata
} from '../controllers/storyController.js';

import { authMiddleware, isStoryAuthor } from '../middlewares/authMiddleware.js';
import { uploadmulterCloudinary } from '../middlewares/upload.js';
import { validateFileMiddleware } from '../middlewares/verifyFileType.js';



const storyRouter = Router();



// Tutte richiedono autenticazione
storyRouter.get('/', authMiddleware, getStories);  // Ottieni storie
storyRouter.get('/:id', authMiddleware, getStoryById);  // Singola storia
storyRouter.post('/', authMiddleware,  uploadmulterCloudinary.single("story"), validateFileMiddleware, createStory);  // Crea storia
storyRouter.put('/:id', authMiddleware, isStoryAuthor, uploadmulterCloudinary.single("story"), updateStory);  // Aggiorna storia (crea se non esiste)
storyRouter.delete('/:id', authMiddleware, isStoryAuthor, deleteStory);  // Elimina storia
storyRouter.post('/:id/view', authMiddleware, viewStory);  // Segna come visualizzata

export default storyRouter;