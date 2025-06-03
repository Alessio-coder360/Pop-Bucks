import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["Editor", "Admin", "User"],
        default: "User"
    },
    // Campi social
    profilePicture: {
        type: String,
        default: "default-profile.jpg"
    },
    bio: String,
    followers: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" 
    }],
    following: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" 
    }],
    // Campi marketplace
    sellerRating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    storeBanner: {
        type: String,
        default: "default-store-banner.jpg"
    },
    //  localizzazione
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere' // Indice geospaziale per query geografiche
                        // Un indice 2dsphere è come una "mappa speciale" per MongoDB:

                        // Permette al database di trovare rapidamente documenti vicini a una posizione geografica
                        // È ottimizzato per coordinate terrestri (considera la curvatura della Terra)
                        // Consente query come:
                        // "Trova tutti i negozi nel raggio di 5km dalla mia posizione"
                        // "Mostra utenti più vicini a me"
                        // "Ordina i risultati per distanza"
                        // Pensa a un indice 2dsphere come a un GPS che il database usa per trovare velocemente posizioni sulla Terra
        },
        address: {
            city: String,
            country: String,
            formattedAddress: String // indirizzo completo in formato legibile spesso generato da servizi geocoding come google maps
            // esempio :  "Via Roma 123, 20100 Milano, Italia
        }
    },
    // Preferenze utente
    preferences: {
        theme: { type: String, default: "light" },
        notificationsEnabled: { type: Boolean, default: true }
    }
}, { timestamps: true });

 // Aggiungi metodo pre-save per hashare la password
 UserSchema.pre('save', async function(next) {
     if (!this.isModified('password')) return next();
  
     try {
         const salt = await bcrypt.genSalt(10);
         this.password = await bcrypt.hash(this.password, salt);
         next();
     } catch (error) {
         next(error);
     }
 });

// Metodo per comparare password
     UserSchema.methods.comparePassword = async function(password) {
         return await bcrypt.compare(password, this.password);
     };
    // bcrypt.compare() sa come verificare se una password corrisponde a un hash, anche se genereresti hash diversi ogni volta.

export default mongoose.model("User", UserSchema);