import {CreateUserDto, EmailConfirmationType, UserDBType, UserViewModel} from "../models/userModel";
import {userCollection} from "../db/mongo-db";
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {emailService} from "../services/emailService";


const SALT_ROUNDS = 10;

export const userRepository = {

    async getByLogin(login: string): Promise<UserDBType | null> {
        return await userCollection.findOne({ login }, { projection: { _id: 0 } });
    },

    async getByEmail(email: string): Promise<UserDBType | null> {
        return await userCollection.findOne({ email }, { projection: { _id: 0 } });
    },

    async getByLoginOrEmail(loginOrEmail: string): Promise<UserDBType | null> {
        return (await this.getByLogin(loginOrEmail)) ?? (await this.getByEmail(loginOrEmail));
    },

    // Метод для проверки существования пользователя
    async doesExistByLoginOrEmail(login: string, email: string): Promise<UserDBType | null> {
        return await userCollection.findOne({
            $or: [
                { login },
                { email }
            ]
        });
    },


    async create(input: CreateUserDto): Promise<UserViewModel | { errorsMessages: { field: string; message: string }[] }> {
        const existingUser = await this.doesExistByLoginOrEmail(input.login, input.email);
        if (existingUser) {
            const field = existingUser.login === input.login ? 'login' : 'email';
            return {
                errorsMessages: [{ field, message: 'User already exists' }]
            };
        }
        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
        // Создание нового пользователя с подтверждением email
        const newUser: UserDBType = {
            id: crypto.randomUUID(),
            login: input.login,
            email: input.email,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            emailConfirmation: {
                confirmationCode: crypto.randomUUID(),
                expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
                isConfirmed: false
            }
        };

        // Вставка нового пользователя в базу данных
        await userCollection.insertOne(newUser);

        // Отправка email с кодом подтверждения
        await emailService.sendEmail(
            input.email,
            'Подтверждение регистрации',
            `Ваш код подтверждения: ${newUser.emailConfirmation.confirmationCode}`,
            `<p>Ваш код подтверждения: <b>${newUser.emailConfirmation.confirmationCode}</b></p>`
        );
        // Возвращаем результат с преобразованными данными пользователя
        return this.mapToOutput(newUser);
    },

    async updateConfirmation(userId: string, updateData: Partial<EmailConfirmationType>): Promise<boolean> {
        const updateFields: Record<string, any> = {};

        if (updateData.confirmationCode !== undefined) {
            updateFields["emailConfirmation.confirmationCode"] = updateData.confirmationCode;
        }
        if (updateData.expirationDate !== undefined) {
            updateFields["emailConfirmation.expirationDate"] = updateData.expirationDate;
        }
        if (updateData.isConfirmed !== undefined) {
            updateFields["emailConfirmation.isConfirmed"] = updateData.isConfirmed;
        }

        const result = await userCollection.updateOne(
            { id: userId },
            { $set: updateFields }
        );

        return result.modifiedCount === 1;
    },



    async findByConfirmationCode(code: string): Promise<UserDBType | null> {
        return await userCollection.findOne({ "emailConfirmation.confirmationCode": code }, { projection: { _id: 0 } });
    },

    async findByLoginOrEmail(loginOrEmail: string): Promise<UserDBType | null> {
        const byLogin = await this.getByLogin(loginOrEmail);
        if (byLogin) return byLogin;
        return await this.getByEmail(loginOrEmail);
    },

    async delete(id: string): Promise<boolean> {
        const result = await userCollection.deleteOne({id:id});
        return result.deletedCount === 1;
    },

    mapToOutput(user: UserDBType): UserViewModel {
        const { _id,password, ...rest } = user;
        return rest;
    }

};

