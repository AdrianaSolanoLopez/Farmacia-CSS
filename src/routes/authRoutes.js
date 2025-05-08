import express from 'express';
import { login, register } from '../controllers/AutenticacionController.js';
import { validateLogin, validateRegister } from '../../middlewares/authValidation.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', validateLogin, login);

// POST /api/auth/register
router.post('/register', validateRegister, register);

export default router;