import { Router, Request, Response } from "express";
import { inputCheckErrorsMiddleware } from "../middlewares/validationMiddleware";
import { jwtAuthMiddleware } from "../middlewares/jwtAuthMiddleware";
import {
    confirmationValidators,
    emailResendingValidators,
    loginValidators,
    registrationValidators
} from "../validators/authValidators";
import { authService } from "../services/authService";
import {userRepository} from "../repositories/userRepository";

export const authRouter = Router();

authRouter.post('/login',
    loginValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response) => {
        const { loginOrEmail, password } = req.body;
        const result = await authService.login(loginOrEmail, password);

        if (!result) {
            res.sendStatus(401);
            return;
        }

        res.status(200).json({ accessToken: result.accessToken });
    }
);

authRouter.get('/me',
    jwtAuthMiddleware,
    async (req: Request, res: Response) => {
        res.status(200).json({
            userId: req.userId,
            login: req.userLogin,
            email: req.userEmail
        });
    }
);

authRouter.post('/registration',
    registrationValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response): Promise<void>  => {
        const { login, password, email } = req.body;

        const existingByLogin = await userRepository.getByLogin(login);
        if (existingByLogin) {
            res.status(400).json({
                errorsMessages: [{ field: "login", message: "should be unique" }]
            });
            return;
        }

        const existingByEmail = await userRepository.getByEmail(email);
        if (existingByEmail) {
           res.status(400).json({
                errorsMessages: [{ field: "email", message: "should be unique" }]
            });
            return;
        }

        const result = await authService.register(login, password, email);
        if (!result) {
            res.status(400);
            return;
        }
        res.sendStatus(204);
    }
);

authRouter.post('/registration-confirmation',
    confirmationValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response) => {
        const confirmed = await authService.confirm(req.body.code);
        if (!confirmed) {
            res.status(400);
            return;
        }
        res.sendStatus(204);
    }
);

authRouter.post('/registration-email-resending',
    emailResendingValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response) => {
        const code = await authService.resendEmail(req.body.email);
        if (!code) {
            res.status(400);
            return;
        }
        res.sendStatus(204);
    }
);
