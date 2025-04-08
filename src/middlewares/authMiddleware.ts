import { Request, Response, NextFunction } from 'express';
import dotenv from "dotenv";


// Загружаем переменные окружения из .env файла
dotenv.config();


// Созадём прослойку для авторизации
export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Проверяем, что переменная окружения установлена
    if (!process.env.ADMIN_AUTH) {
        console.error('ADMIN_AUTH is not set in .env file');
        res.sendStatus(500);
        return;
    }
    // Проверяем формат ADMIN_AUTH
    const adminAuthParts = process.env.ADMIN_AUTH.split(':');
    if (adminAuthParts.length !== 2 || !adminAuthParts[0] || !adminAuthParts[1]) {
        console.error('Invalid ADMIN_AUTH format in .env. Expected "login:password"');
        res.sendStatus(500);
        return;
    }

    const [adminLogin, adminPassword] = adminAuthParts;

    // объявляем условия типы входящих данных
    const authHeader = req.headers.authorization || req.headers['authorization'];

    //  Проверка если не строка или авторизационный заголовок не зашифровон с помощью basic отправляем 401 статус
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Basic ')) {
        res.sendStatus(401);
        return;
    }

    try {
        // делим пришедшую сроку по пробелу и берем вторую часть
        const base64 = authHeader.split(' ')[1];
        // далее декодируем полученное значение из переменной (в ней должно быть значение пароля)
        const credentials = Buffer.from(base64, 'base64').toString('utf-8');
        // разделяем полученную строку на логин и пароль
        const [login, password] = credentials.split(':');
        // проверяем значение авторазации
        if (login === adminLogin && password === adminPassword) {
            next();
        } else {
            res.sendStatus(401);
        }
    } catch (e) {
        res.sendStatus(401);
    }
};