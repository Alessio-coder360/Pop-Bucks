import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    cover: {
        type: String,
        required: true
    },
    readTime: {
        value: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            enum: ["minutes", "hours"],
            required: true
        }
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // Post social style
    media: [{
        type: {
            type: String,
            enum: ["image", "video"],
            default: "image"
        },
        url: String
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"

        // definisci like gia come array, importante per il contatore e per il front end 
    }],
    views: {
        type: Number,
        default: 0  // Inizia da zero visualizzazioni
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    // Elementi marketplace
    linkedItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    }],
    location: {
        name: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    hashtags: [String]
}, 
{ timestamps: true ,
    timestamps: true,
    toJSON: { virtuals: true },  // Includi virtuals quando converti in JSON
    toObject: { virtuals: true}
});

// Virtual per conteggio like
PostSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

//.virtual() è un metodo di Mongoose che esiste nella definizione dello schema. 
// Non è JavaScript standard, ma una funzionalità specifica di Mongoose che ti permette di definire proprietà virtuali (calcolate).
//  serve per: 
// Definire campi calcolati che non vengono salvati nel database

// Risparmi spazio di archiviazione
// Eviti problemi di sincronizzazione tra dati reali e dati derivati
// Fornire proprietà comode calcolate dal modello

// likeCount invece di dover fare post.likes.length ogni volta
// commentCount invece di dover fare post.comments.length
// fullName invece di concatenare sempre firstName e lastName
// Presentare i dati in modi diversi senza modificare lo schema del database

// Puoi avere date formattate, conteggi, stati calcolati, ecc.




// Le proprietà virtuali non vengono mai salvate nel database - sono calcolate al volo quando richiedi i dati. 
// Se guardi direttamente nel database MongoDB, non vedrai un campo likeCount.

// È proprio questo il loro vantaggio:
//  non occupano spazio nel database ma forniscono un modo pratico per accedere a dati calcolati quando li recuperi tramite Mongoose.

// this.likes accede all'array likes del documento post corrente
// Senza this non potresti accedere ai dati del documento

// Virtual per conteggio commenti
PostSchema.virtual('commentCount').get(function() {
    return this.comments ? this.comments.length : 0;
});

export default mongoose.model("Post", PostSchema);