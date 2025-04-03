import { randomUUID } from "crypto";
import { add } from "date-fns";
import { EmailConfirmationType, UserDBType } from "../models/userModel";
import { userRepository } from "../repositories/userRepository";
import { bcryptService } from "./bcryptService";
import { emailService } from "./emailService";

export const authService = {
    async registerUser(login: string, password: string, email: string): Promise<UserDBType | null> {
        if (await userRepository.doesExistByLoginOrEmail(login, email)) return null;

        const passwordHash = await bcryptService.generateHash(password);
        const emailConfirmation = generateEmailConfirmation();

        const newUser: UserDBType = {
            id: Date.now().toString(),
            login,
            password: passwordHash,
            email,
            createdAt: new Date().toISOString(),
            emailConfirmation,
        };

        await userRepository.create(newUser);
        await emailService.sendRegistrationEmail(newUser.email, emailConfirmation.confirmationCode);
        return newUser;
    },

    async confirmRegistration(code: string): Promise<boolean> {
        const user = await userRepository.findByConfirmationCode(code);
        if (!user || new Date() > new Date(user.emailConfirmation.expirationDate) || user.emailConfirmation.isConfirmed) {
            return false;
        }

        return await userRepository.updateConfirmation(user.id, { isConfirmed: true });
    },

    // Изменён метод: теперь возвращает новый confirmationCode, если письмо успешно отправлено, иначе null.
    async resendRegistrationEmail(email: string): Promise<string | null> {
        const user = await userRepository.getByEmail(email);
        if (!user || user.emailConfirmation.isConfirmed) return null;

        const emailConfirmation = generateEmailConfirmation();
        await userRepository.updateConfirmation(user.id, emailConfirmation);
        const sent = await emailService.sendRegistrationEmail(user.email, emailConfirmation.confirmationCode);
        return sent ? emailConfirmation.confirmationCode : null;
    },
};

function generateEmailConfirmation(): EmailConfirmationType {
    return {
        confirmationCode: randomUUID(),
        expirationDate: add(new Date(), { hours: 1, minutes: 30 }),
        isConfirmed: false,
    };
}
