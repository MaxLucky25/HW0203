import { Request, Response, NextFunction } from 'express';

const ADMIN_AUTH = 'admin:qwerty';
// Созадём прослойку для авторизации
export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
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
        if (login === 'admin' && password === 'qwerty') {
            next();
        } else {
            res.sendStatus(401);
        }
    } catch (e) {
        res.sendStatus(401);
    }
};