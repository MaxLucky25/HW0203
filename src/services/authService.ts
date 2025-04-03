import { randomUUID } from "crypto";
import { add } from "date-fns";
import { EmailConfirmationType, UserDBType } from "../models/userModel";
import { userRepository } from "../repositories/userRepository";
import { bcryptService } from "./bcryptService";
import { emailService } from "./emailService";

export const authService = {
    async registerUser(login: string, password: string, email: string): Promise<UserDBType | null> {
        console.log(`Регистрация пользователя: login=${login}, email=${email}`);
        if (await userRepository.doesExistByLoginOrEmail(login, email)) {
            console.warn(`Пользователь с login=${login} или email=${email} уже существует`);
            return null;
        }
        const passwordHash = await bcryptService.generateHash(password);
        const emailConfirmation = generateEmailConfirmation();
        console.log(`Сгенерирован confirmationCode: ${emailConfirmation.confirmationCode}`);

        const newUser: UserDBType = {
            id: Date.now().toString(),
            login,
            password: passwordHash,
            email,
            createdAt: new Date().toISOString(),
            emailConfirmation,
        };

        try {
            await userRepository.create(newUser);
            console.log(`Пользователь ${login} успешно создан`);
        } catch (error) {
            console.error(`Ошибка при создании пользователя ${login}:`, error);
            return null;
        }

        const emailSent = await emailService.sendRegistrationEmail(newUser.email, emailConfirmation.confirmationCode);
        if (emailSent) {
            console.log(`Письмо с подтверждением отправлено на ${newUser.email}`);
        } else {
            console.error(`Не удалось отправить письмо на ${newUser.email}`);
        }
        return newUser;
    },

    async confirmRegistration(code: string): Promise<boolean> {
        console.log(`Подтверждение регистрации с кодом: ${code}`);
        const user = await userRepository.findByConfirmationCode(code);
        if (!user) {
            console.warn(`Пользователь с кодом ${code} не найден`);
            return false;
        }
        if (new Date() > new Date(user.emailConfirmation.expirationDate)) {
            console.warn(`Код ${code} просрочен`);
            return false;
        }
        if (user.emailConfirmation.isConfirmed) {
            console.warn(`Пользователь с кодом ${code} уже подтверждён`);
            return false;
        }
        const updateResult = await userRepository.updateConfirmation(user.id, { isConfirmed: true });
        console.log(`Обновление подтверждения для ${user.login}: ${updateResult}`);
        return updateResult;
    },

    async resendRegistrationEmail(email: string): Promise<string | null> {
        console.log(`Повторная отправка письма на ${email}`);
        const user = await userRepository.getByEmail(email);
        if (!user) {
            console.warn(`Пользователь с email ${email} не найден`);
            return null;
        }
        if (user.emailConfirmation.isConfirmed) {
            console.log(`Пользователь с email ${email} уже подтверждён. Повторная отправка не требуется.`);
            return user.emailConfirmation.confirmationCode;
        }
        const emailConfirmation = generateEmailConfirmation();
        console.log(`Сгенерирован новый confirmationCode: ${emailConfirmation.confirmationCode} для ${user.login}`);
        const updateResult = await userRepository.updateConfirmation(user.id, emailConfirmation);
        if (!updateResult) {
            console.error(`Не удалось обновить confirmationCode для пользователя ${user.login}`);
            return null;
        }
        const sent = await emailService.sendRegistrationEmail(user.email, emailConfirmation.confirmationCode);
        if (sent) {
            console.log(`Письмо повторно отправлено на ${user.email}`);
            return emailConfirmation.confirmationCode;
        } else {
            console.error(`Не удалось отправить письмо на ${user.email}`);
            return null;
        }
    },
};

function generateEmailConfirmation(): EmailConfirmationType {
    return {
        confirmationCode: randomUUID(),
        expirationDate: add(new Date(), { hours: 1, minutes: 30 }),
        isConfirmed: false,
    };
}
