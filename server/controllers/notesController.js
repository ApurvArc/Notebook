import mongoose from "mongoose";
import Note from "../models/Note.js";
import User from "../models/User.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const accessFilter = (userId) => ({
  $or: [{ owner: userId }, { sharedWith: userId }],
});

export const getAllNotes = async (req, res) => {
  try {
    // Spec: 'all notes created by the user' — owner only
    const filter = { owner: req.user.id };
    const query = Note.find(filter).sort({ isPinned: -1, updatedAt: -1 });

    if (req.query.page || req.query.limit) {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
      query.skip((page - 1) * limit).limit(limit);
    }

    const notes = await query;
    return res.status(200).json(notes.map((note) => note.toPublic()));
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid note ID format." });
    }

    const note = await Note.findOne({ _id: id, ...accessFilter(req.user.id) });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or you do not have access to it.",
      });
    }

    return res.status(200).json(note.toPublic());
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.create({ title, content, owner: req.user.id });
    return res.status(201).json(note.toPublic());
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid note ID format." });
    }

    const note = await Note.findOne({ _id: id, owner: req.user.id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or you are not the owner.",
      });
    }

    const { title, content } = req.body;

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;

    await note.save();
    return res.status(200).json(note.toPublic());
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid note ID format." });
    }

    const note = await Note.findOneAndDelete({ _id: id, owner: req.user.id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or you are not the owner.",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const shareNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { share_with_email } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid note ID format." });
    }

    const note = await Note.findOne({ _id: id, owner: req.user.id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or you are not the owner.",
      });
    }

    const targetUser = await User.findOne({ email: share_with_email.toLowerCase() });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "No user found with that email address.",
      });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot share a note with yourself.",
      });
    }

    const alreadyShared = note.sharedWith.some(
      (userId) => userId.toString() === targetUser._id.toString()
    );

    if (alreadyShared) {
      return res.status(409).json({
        success: false,
        message: "Note is already shared with this user.",
      });
    }

    note.sharedWith.push(targetUser._id);
    await note.save();

    return res.status(200).json({
      message: `Note successfully shared with ${share_with_email}.`,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const togglePin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid note ID format." });
    }

    const note = await Note.findOne({ _id: id, owner: req.user.id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or you are not the owner.",
      });
    }

    note.isPinned = !note.isPinned;
    await note.save();

    return res.status(200).json({
      message: `Note ${note.isPinned ? "pinned" : "unpinned"} successfully.`,
      note: note.toPublic(),
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const searchNotes = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query parameter 'q' is required.",
      });
    }

    const notes = await Note.find({
      $text: { $search: q },
      ...accessFilter(req.user.id),
    }).sort({ score: { $meta: "textScore" } });

    return res.status(200).json({
      success: true,
      data: notes.map((note) => note.toPublic()),
      total: notes.length,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
