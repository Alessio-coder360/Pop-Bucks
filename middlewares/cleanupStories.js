import cron from 'node-cron';
import Story from '../models/story.js';
import cloudinary from '../config/cloudinary.js';
import { getPublicIdFromUrl } from '../controllers/storyController.js';

const testStory = new Story();
console.log("Expiration test:", testStory.expiresAt);
console.log("Data corrente:", new Date());
console.log("Differenza (minuti):", (testStory.expiresAt - new Date()) / (60 * 1000));

// Pianifica un job che si esegue ogni giorno alle 3:00
// quanto spesso il sistema controlla se ci sono storie scadute (CRON.SCHEDULE)
cron.schedule('*/3 * * * *',async ()=>{   // ('0 3 * * *', async () => {
  console.log('Esecuzione pulizia storie scadute...');
  try {
    // Trova le storie scadute
    const expiredStories = await Story.find({
      expiresAt: { $lt: new Date() }
    });
    console.log("Data attuale:", new Date());
console.log("Storie trovate:", expiredStories.length);
if (expiredStories.length > 0) {
  console.log("Prima storia scaduta:", expiredStories[0].expiresAt);
}
    
    // Per ogni storia scaduta, elimina il file da Cloudinary
    for (const story of expiredStories) {
      try {
        const publicId = getPublicIdFromUrl(story.media.url);
        await cloudinary.uploader.destroy(publicId);
        console.log(`File eliminato da Cloudinary: ${publicId}`);
      } catch (cloudinaryError) {
        console.error(`Errore nell'eliminazione del file Cloudinary:`, cloudinaryError);
      }
    }
    
    // Elimina le storie scadute dal database
    const result = await Story.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log(`Eliminate ${result.deletedCount} storie scadute`);
  } catch (error) {
    console.error('Errore durante la pulizia delle storie:', error);
  }
});

// Aggiungi in fondo al file:
export default {
    runCleanup: async () => {
      // Inserisci qui il codice per la pulizia
      console.log('Esecuzione pulizia storie scadute...');
      try {
        // ...
      } catch (error) {
        // ...
      }
    },
    scheduleJob: () => {
      return cron.schedule('0 3 * * *', async () => {
        // Inserisci qui il codice per la pulizia
      });
    }
  };



// Spiegazione del Formato Cron
// Un'espressione cron richiede 5 campi separati da spazi:
//   ┌───────────── minuto (0-59)
// │ ┌───────────── ora (0-23)
// │ │ ┌───────────── giorno del mese (1-31)
// │ │ │ ┌───────────── mese (1-12)
// │ │ │ │ ┌───────────── giorno della settimana (0-6, 0=domenica)
// │ │ │ │ │
// * * * * *