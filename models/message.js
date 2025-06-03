// models/message.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    type: {
      type: String,
      enum: ["image", "video", "document"]
    },
    url: String,
    name: String
  }]
}, { timestamps: true });

export default mongoose.model("Message", MessageSchema);