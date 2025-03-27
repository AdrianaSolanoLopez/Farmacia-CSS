import { validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

export const validateInputs = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400);
  }
  next();
};