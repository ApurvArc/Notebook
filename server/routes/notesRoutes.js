import express from "express";
import { body } from "express-validator";
import protect from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
  togglePin,
} from "../controllers/notesController.js";

const router = express.Router();

router.use(protect);

const noteValidators = [
  body("title")
    .notEmpty().withMessage("Title is required.")
    .isLength({ max: 200 }).withMessage("Title cannot exceed 200 characters."),
  body("content")
    .notEmpty().withMessage("Content is required."),
];

const updateValidators = [
  body("title")
    .optional()
    .notEmpty().withMessage("Title cannot be empty.")
    .isLength({ max: 200 }).withMessage("Title cannot exceed 200 characters."),
  body("content")
    .optional()
    .notEmpty().withMessage("Content cannot be empty."),
];

router.get("/", getAllNotes);
router.get("/:id", getNoteById);
router.post("/", noteValidators, validate, createNote);
router.put("/:id", updateValidators, validate, updateNote);
router.delete("/:id", deleteNote);
router.patch("/:id/pin", togglePin);

router.post(
  "/:id/share",
  [
    body("share_with_email")
      .notEmpty().withMessage("share_with_email is required.")
      .isEmail().withMessage("Please provide a valid email address.")
      .normalizeEmail(),
  ],
  validate,
  shareNote
);

export default router;
