import express from "express";
import { body } from "express-validator";
import { register, login } from "../controllers/authController.js";
import validate from "../middleware/validate.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("email")
      .notEmpty().withMessage("Email is required.")
      .isEmail().withMessage("Please provide a valid email address.")
      .toLowerCase(),
    body("password")
      .notEmpty().withMessage("Password is required.")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email")
      .notEmpty().withMessage("Email is required.")
      .isEmail().withMessage("Please provide a valid email address.")
      .toLowerCase(),
    body("password")
      .notEmpty().withMessage("Password is required."),
  ],
  validate,
  login
);

export default router;
