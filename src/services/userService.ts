import { userRepository } from '../repositories/userRepository';
import { userQueryRepository } from '../repositories/userQueryRepository';
import { CreateUserDto, UserViewModel, UserDBType } from '../models/userModel';
import bcrypt from 'bcryptjs';


export const userService = {

    async getUsers(query: any) {
        return await userQueryRepository.getUsers(query);
    },

    async createUser(input: CreateUserDto): Promise<UserViewModel | { errorsMessages: { field: string; message: string }[] }> {
        return await userRepository.create(input);
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