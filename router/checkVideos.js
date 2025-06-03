import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Story from '../models/story.js';

dotenv.config();

// Connessione al database
mongoose.connect(process.env.MONGODB_CONNECTION_URI)
  .then(() => console.log('✅ MongoDB connesso'))
  .catch(err => {
    console.error('❌ Errore connessione MongoDB:', err);
    process.exit(1);
  });

async function checkVideoStories() {
  try {
    // Ottieni i file video in temp
    const tempFolder = path.join(process.cwd(), 'temp');
    const files = fs.readdirSync(tempFolder).filter(f => f.includes('video-story'));
    
    console.log(`🔍 Trovati ${files.length} file video in temp`);
    
    // Trova tutte le storie video nel database
    const videoStories = await Story.find({ 'media.type': 'video' })
      .populate('author', 'firstName lastName email')
      .lean();
    
    console.log(`🔍 Trovate ${videoStories.length} storie video nel database`);
    
    // Verifica ciascun file
    for (const file of files) {
      console.log(`\n📋 Controllo file: ${file}`);
      
      // Controlla se il file è collegato a qualche storia
      const matchingStories = videoStories.filter(story => {
        const urlParts = story.media.url.split('/');
        const cloudinaryFilename = urlParts[urlParts.length - 1];
        return cloudinaryFilename.includes(file.split('.')[0]);
      });
      
      if (matchingStories.length > 0) {
        console.log(`✅ File collegato a ${matchingStories.length} storie`);
        
        // Mostra dettagli
        matchingStories.forEach(story => {
          console.log(`  👤 Autore: ${story.author.firstName} ${story.author.lastName} (${story.author.email})`);
          console.log(`  🔗 Item collegato: ${story.linkedItem ? '✅' : '❌'}`);
          console.log(`  🔗 Post collegato: ${story.linkedPost ? '✅' : '❌'}`);
          console.log(`  🌐 URL: ${story.media.url}`);
        });
      } else {
        console.log(`❌ File NON trovato nel database`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

checkVideoStories();

