import crypto from 'crypto';
import { UserDBType } from "../models/userModel";
import { userRepository } from "../repositories/userRepository";
import { bcryptService } from "./bcryptService";
import { emailService } from "./emailService";


const uuidv4 = () => crypto.randomUUID()

export const authService = {
    async registerUser(login: string, password: string, email: string): Promise<UserDBType | null> {
        // Проверяем существование пользователя
        const existingUser = await userRepository.doesExistByLoginOrEmail(login, email);
        if (existingUser) return null;

        // Генерируем хеш пароля
        const passwordHash = await bcryptService.generateHash(password);

        // Создаём объект подтверждения
        const emailConfirmation = {
            confirmationCode: uuidv4(), // Используем UUID вместо случайных чисел
            expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
            isConfirmed: false
        };

        // Создаём пользователя
        const newUser: UserDBType = {
            id: uuidv4(),
            login,
            password: passwordHash,
            email,
            createdAt: new Date().toISOString(),
            emailConfirmation
        };

        // Сохраняем пользователя
        const created = await userRepository.create(newUser);

        // Отправляем письмо
        await emailService.sendRegistrationEmail(email, emailConfirmation.confirmationCode);

        return newUser;
    },

    async confirmRegistration(code: string): Promise<boolean> {
        const user = await userRepository.findByConfirmationCode(code);

        if (!user ||
            user.emailConfirmation.isConfirmed ||
            new Date() > user.emailConfirmation.expirationDate
        ) {
            return false;
        }

        return userRepository.updateConfirmation(user.id, { isConfirmed: true });
    },

    async resendRegistrationEmail(email: string): Promise<boolean> {
        const user = await userRepository.getByEmail(email);

        if (!user || user.emailConfirmation.isConfirmed) {
            return false;
        }

        const newConfirmation = {
            confirmationCode: uuidv4(),
            expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };

        await userRepository.updateConfirmation(user.id, newConfirmation);
        return emailService.sendRegistrationEmail(email, newConfirmation.confirmationCode);
    }


};

