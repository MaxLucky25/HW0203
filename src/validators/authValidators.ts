import { body } from 'express-validator';

export const registrationValidators = [
    body('login')
        .isString().withMessage('Login must be a string')
        .isLength({ min: 3, max: 10 }).withMessage('Login must be between 3 and 10 characters')
        .matches(/^[a-zA-Z0-9_-]*$/).withMessage('Login contains invalid characters'),
    body('password')
        .isString().withMessage('Password must be a string')
        .isLength({ min: 6, max: 20 }).withMessage('Password must be between 6 and 20 characters'),
    body('email')
        .isString().withMessage('Email must be a string')
        .isEmail().withMessage('Invalid email format'),
];

export const loginValidators = [
    body('loginOrEmail')
        .isString().withMessage('loginOrEmail must be a string')
        .notEmpty().withMessage('loginOrEmail is required'),
    body('password')
        .isString().withMessage('Password must be a string')
        .notEmpty().withMessage('Password is required'),
];

export const confirmationValidators = [
    body('code')
        .isString().withMessage('Code must be a string')
        .notEmpty().withMessage('Code is required'),
];

export const emailResendingValidators = [
    body('email')
        .isString().withMessage('Email must be a string')
        .isEmail().withMessage('Invalid email format'),
];
