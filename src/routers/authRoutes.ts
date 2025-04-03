import {Router, Request, Response, NextFunction} from "express";
import { inputCheckErrorsMiddleware } from "../middlewares/validationMiddleware";
import { userService } from "../services/userService";
import jwt, {SignOptions} from 'jsonwebtoken';
import { jwtAuthMiddleware } from "../middlewares/jwtAuthMiddleware";
import {confirmationValidators, emailResendingValidators, loginValidators, registrationValidators} from "../validators/authValidators";
import {authService} from "../services/authService";
import {userRepository} from "../repositories/userRepository";
import config from "../utility/config";


export const authRouter = Router();

// Обработчик login
authRouter.post('/login', loginValidators, inputCheckErrorsMiddleware,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { loginOrEmail, password } = req.body;

            const user = await userService.findUserByLoginOrEmail(loginOrEmail);
            if (!user || !user.emailConfirmation.isConfirmed) {
                res.sendStatus(401);
                return;
            }

            const isValid = await userService.verifyPassword(user, password);
            if (!isValid) {
                res.sendStatus(401);
                return;
            }



            const token = jwt.sign(
                { userId: user.id, login: user.login, email: user.email },
                config.JWT_SECRET,
            );

            (req as any).state = { accessToken: token };
            res.status(200).json({ accessToken: token });
        } catch (e) {
            next(e);
        }
    });

// Обработчик me
authRouter.get('/me',
    jwtAuthMiddleware,
    (req: Request, res: Response): void => {
        if (!req.userId) {
            res.sendStatus(401);
            return;
        }
        res.status(200).json({
            userId: req.userId,
            login: req.userLogin,
            email: req.userEmail
        });
    });

// Обработчик registration
authRouter.post('/registration',
    registrationValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response): Promise<void> => {
        const { login, password, email } = req.body;
        const existingUser = await userRepository.doesExistByLoginOrEmail(login, email);

        if (existingUser) {
            const field = existingUser.login === login ? 'login' : 'email';
            res.status(400).json({
                errorsMessages: [{ field, message: 'User already exists' }]
            });
            return;
        }

        const user = await authService.registerUser(login, password, email);
        if (!user) {
            res.sendStatus(400);
            return;
        }
        res.sendStatus(204);
    }
);

// Обработчик registration-confirmation
authRouter.post('/registration-confirmation',
    confirmationValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response): Promise<void> => {
        const { code } = req.body;
        const confirmed = await authService.confirmRegistration(code);
        if (!confirmed) {
            res.status(400).json({
                errorsMessages: [{ field: "code", message: "Incorrect, expired, or already confirmed code" }]
            });
            return;
        }
        res.sendStatus(204);
    }
);

// Обработчик registration-email-resending
authRouter.post('/registration-email-resending',
    emailResendingValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response): Promise<void> => {
        const { email } = req.body;
        const sent = await authService.resendRegistrationEmail(email);
        if (!sent) {
            res.status(400).json({
                errorsMessages: [{ field: "email", message: "Invalid email or email already confirmed" }]
            });
            return;
        }
        res.sendStatus(204);
    }
);