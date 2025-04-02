import { Router, Request, Response } from "express";
import { inputCheckErrorsMiddleware } from "../middlewares/validationMiddleware";
import { userService } from "../services/userService";
import jwt from 'jsonwebtoken';
import { jwtAuthMiddleware } from "../middlewares/jwtAuthMiddleware";
import {confirmationValidators, emailResendingValidators, loginValidators, registrationValidators} from "../validators/authValidators";
import {authMailService} from "../services/authMailService";


const JWT_SECRET= process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN= process.env.JWT_EXPIRES_IN || '1h';

export const authRouter = Router();

// возвращает JWT accessToken
authRouter.post('/login',
    loginValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response) => {
        const { loginOrEmail, password } = req.body;
        const user = await userService.findUserByLoginOrEmail(loginOrEmail);
        if (!user) {
            res.sendStatus(401);
            return;
        }
        const isValid = await userService.verifyPassword(user, password);
        if (!isValid) {
            res.sendStatus(401);
            return;
        }
        // Генерация JWT-токена
        const token = jwt.sign(
            { userId: user.id, login: user.login, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
        );
        res.status(200).json({ accessToken: token });
    }
);

// получение информации о текущем пользователе
authRouter.get('/me',
    jwtAuthMiddleware,
    async (req: Request, res: Response) => {
    if (!req.userId) {
        res.sendStatus(401);
        return
    }
    res.status(200).json({
        userId: req.userId,
        login: req.userLogin,
        email: req.userEmail
    });
});

// Регистрация: отправка письма с confirmationCode
authRouter.post('/registration',
    registrationValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response) => {
        const { login, password, email } = req.body;
        const user = await authMailService.registerUser(login, password, email);
        if (!user) {
            res.status(400).json({
                errorsMessages: [{ field: "loginOrEmail", message: "User already exists or invalid input" }]
            });
            return;
        }
        // Согласно спецификации возвращаем 204
        res.sendStatus(204);
    }
);

// Подтверждение регистрации
authRouter.post('/registration-confirmation',
    confirmationValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response) => {
        const { code } = req.body;
        const confirmed = await authMailService.confirmRegistration(code);
        if (!confirmed) {
            res.status(400).json({
                errorsMessages: [{ field: "code", message: "Incorrect, expired, or already confirmed code" }]
            });
            return;
        }
        res.sendStatus(204);
    }
);

// Переотправка письма с confirmationCode
authRouter.post('/registration-email-resending',
    emailResendingValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response) => {
        const { email } = req.body;
        const sent = await authMailService.resendRegistrationEmail(email);
        if (!sent) {
            res.status(400).json({
                errorsMessages: [{ field: "email", message: "Invalid email or email already confirmed" }]
            });
            return;
        }
        res.sendStatus(204);
    }
);


