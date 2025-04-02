import { randomUUID } from "crypto";
import { add } from "date-fns";
import { EmailConfirmationType, UserDBType } from "../models/userModel";
import { userRepository } from "../repositories/userRepository";
import { bcryptService } from "./bcryptService";
import { emailService } from "./emailService";



export const authMailService = {
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

    async resendRegistrationEmail(email: string): Promise<boolean> {
        const user = await userRepository.getByEmail(email);
        if (!user || user.emailConfirmation.isConfirmed) return false;

        const emailConfirmation = generateEmailConfirmation();
        await userRepository.updateConfirmation(user.id, emailConfirmation);
        return await emailService.sendRegistrationEmail(user.email, emailConfirmation.confirmationCode);
    },

    // async loginUser(loginOrEmail: string, password: string): Promise<{ accessToken: string } | null> {
    //     const user = await userRepository.findByLoginOrEmail(loginOrEmail);
    //     if (!user || !(await bcryptService.compareHash(password, user.password))) return null;
    //
    //     const accessToken = jwt.sign(
    //         { userId: user.id, login: user.login, email: user.email },
    //         process.env.JWT_SECRET,
    //         { expiresIn: process.env.JWT_EXPIRES_IN }
    //     );
    //     return { accessToken };
    // },
};

function generateEmailConfirmation(): EmailConfirmationType {
    return {
        confirmationCode: randomUUID(),
        expirationDate: add(new Date(), { hours: 1, minutes: 30 }),
        isConfirmed: false,
    };
}
