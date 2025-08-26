import express from "express";
import { login } from "../controllers/auth.controller.js";
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email & password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: JWT token and user info
 */
export const authRouter = express.Router();
authRouter.post("/login", login);
