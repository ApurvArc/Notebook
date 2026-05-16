import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

noteSchema.index({ title: "text", content: "text" });

noteSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    title: this.title,
    content: this.content,
    is_pinned: this.isPinned,
    created_at: this.createdAt,
    updated_at: this.updatedAt,
  };
};

export default mongoose.model("Note", noteSchema);

