import mongoose from "mongoose";

const StorySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    media: {
        type: {
            type: String,
            enum: ["image", "video"],
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    // Le storie scadono dopo 24 ore
   // expiresAt: {
        // type: Date,
        // default: function() {
        //     return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore da ora
        // }
        // type: Date,
        // default: function() {
        //     return new Date(Date.now() + 4 * 60 * 1000); // 4 minuti da ora (per test)
        // }

    //}
    
    // Link a un articolo in vendita
    linkedItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    },
    linkedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    // Chi ha visto questa storia
    viewers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// Aggiungi questo nello schema Story.js
StorySchema.pre('validate', function(next) {
  if (this.linkedItem && this.linkedPost) {
    return next(new Error('Una storia può essere collegata o a un item o a un post, non entrambi'));
  }
  next();
});

export default mongoose.model("Story", StorySchema);