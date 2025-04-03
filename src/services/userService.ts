import { userRepository } from '../repositories/userRepository';
import { userQueryRepository } from '../repositories/userQueryRepository';
import { CreateUserDto, UserViewModel, UserDBType } from '../models/userModel';
import bcrypt from 'bcryptjs';
import {randomUUID} from "crypto";


export const userService = {

    async getUsers(query: any) {
        return await userQueryRepository.getUsers(query);
    },

    async createUser(input: CreateUserDto): Promise<UserViewModel | { errorsMessages: { field: string; message: string }[] }> {
        // Хешируем пароль
        const passwordHash = await bcrypt.hash(input.password, 10);
        // Формируем полный объект пользователя (UserDBType)
        const newUser: UserDBType = {
            id: Date.now().toString(),
            login: input.login,
            email: input.email,
            password: passwordHash,
            createdAt: new Date().toISOString(),
            emailConfirmation: {
                confirmationCode: randomUUID(),
                expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // например, на 24 часа
                isConfirmed: false,
            },
        };

        // Вызываем метод репозитория для создания пользователя
        return await userRepository.create(newUser);
    },
    async deleteUser(id: string): Promise<boolean> {
        return await userRepository.delete(id);
    },

    async findUserByLoginOrEmail(loginOrEmail: string) {
        return await userRepository.getByLoginOrEmail(loginOrEmail);
    },

    // проверка пароля
    async verifyPassword(user: UserDBType, password: string): Promise<boolean> {
        return await bcrypt.compare(password, user.password);
    }
};