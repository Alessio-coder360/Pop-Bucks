import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        maxLength: 500
    },
    // Un commento può essere su post o su item
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    },
    // Per commenti annidati/risposte
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    // 
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

//Valida che il commento appartenga a un post o a un item
CommentSchema.pre('validate', function(next) {
    if (!this.post && !this.item) {
        return next(new Error('Il commento deve appartenere a un post o a un articolo'));
    }
    if (this.post && this.item) {
        return next(new Error('Il commento non può appartenere sia a un post che a un articolo'));
    }
    next();
});

export default mongoose.model("Comment", CommentSchema);