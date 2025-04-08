import { userRepository } from '../repositories/userRepository';
import { userQueryRepository } from '../repositories/userQueryRepository';
import { CreateUserDto, UserViewModel, UserDBType } from '../models/userModel';
import bcrypt from 'bcryptjs';
import {randomUUID} from "crypto";


export const userService = {

    async getUsers(query: any) {
        return await userQueryRepository.getUsers(query);
    },

    async deleteUser(id: string): Promise<boolean> {
        return await userRepository.delete(id);
    },

    async createUserByAdmin(input: CreateUserDto): Promise<UserViewModel | { errorsMessages: { field: string; message: string }[] }> {
        const passwordHash = await bcrypt.hash(input.password, 10);

        const newUser: UserDBType = {
            id: Date.now().toString(),
            login: input.login,
            email: input.email,
            password: passwordHash,
            createdAt: new Date().toISOString(),
            emailConfirmation: {
                confirmationCode: randomUUID(),
                expirationDate: new Date(),
                isConfirmed: true,
            },
        };

        return await userRepository.create(newUser);
    }


};