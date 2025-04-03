import { CreateUserDto, EmailConfirmationType, UserDBType, UserViewModel } from "../models/userModel";
import { userCollection } from "../db/mongo-db";
import { emailService } from "../services/emailService";

export const userRepository = {

    async getByLogin(login: string): Promise<UserDBType | null> {
        console.log(`Поиск пользователя по login: ${login}`);
        return await userCollection.findOne({ login }, { projection: { _id: 0 } });
    },

    async getByEmail(email: string): Promise<UserDBType | null> {
        console.log(`Поиск пользователя по email: ${email}`);
        return await userCollection.findOne({ email }, { projection: { _id: 0 } });
    },

    async getByLoginOrEmail(loginOrEmail: string): Promise<UserDBType | null> {
        console.log(`Поиск пользователя по login или email: ${loginOrEmail}`);
        return (await this.getByLogin(loginOrEmail)) ?? (await this.getByEmail(loginOrEmail));
    },

    async doesExistByLoginOrEmail(login: string, email: string): Promise<UserDBType | null> {
        const byLogin = await this.getByLogin(login);
        if (byLogin) return byLogin;
        const byEmail = await this.getByEmail(email);
        return byEmail;
    },

    async create(user: UserDBType): Promise<UserViewModel | { errorsMessages: { field: string; message: string }[] }> {
        console.log(`Создание пользователя: login=${user.login}, email=${user.email}`);
        const existingUser = await this.getByLoginOrEmail(user.login) ?? await this.getByEmail(user.email);
        if (existingUser) {
            console.warn(`Пользователь уже существует: ${user.login} или ${user.email}`);
            return {
                errorsMessages: [{ field: existingUser.login === user.login ? 'login' : 'email', message: 'should be unique' }]
            };
        }
        try {
            await userCollection.insertOne(user);
            console.log(`Пользователь ${user.login} успешно добавлен в БД`);
        } catch (error) {
            console.error(`Ошибка вставки пользователя ${user.login} в БД:`, error);
            throw error;
        }
        // Отправляем письмо с подтверждением (можно и здесь, или вызывать выше)
        await emailService.sendRegistrationEmail(user.email, user.emailConfirmation.confirmationCode);
        return this.mapToOutput(user);
    },

    async updateConfirmation(userId: string, updateData: Partial<EmailConfirmationType>): Promise<boolean> {
        console.log(`Обновление данных подтверждения для userId=${userId}:`, updateData);
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
        console.log(`Результат обновления для userId=${userId}:`, result);
        return result.modifiedCount === 1;
    },

    async findByConfirmationCode(code: string): Promise<UserDBType | null> {
        console.log(`Поиск пользователя по confirmationCode: ${code}`);
        return await userCollection.findOne({ "emailConfirmation.confirmationCode": code }, { projection: { _id: 0 } });
    },

    async findByLoginOrEmail(loginOrEmail: string): Promise<UserDBType | null> {
        console.log(`Поиск пользователя по login или email: ${loginOrEmail}`);
        const byLogin = await this.getByLogin(loginOrEmail);
        if (byLogin) return byLogin;
        return await this.getByEmail(loginOrEmail);
    },

    async delete(id: string): Promise<boolean> {
        console.log(`Удаление пользователя с id: ${id}`);
        const result = await userCollection.deleteOne({ id: id });
        console.log(`Результат удаления для userId=${id}:`, result);
        return result.deletedCount === 1;
    },

    mapToOutput(user: UserDBType): UserViewModel {
        const { _id, password, ...rest } = user;
        return rest;
    }
};
