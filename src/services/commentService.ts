import { commentRepository } from "../repositories/commentRepository";
import {CommentViewModel, CreateCommentDto, UpdateCommentDto} from "../models/commentModels";
import { postRepository } from "../repositories/postRepository";


export const commentService = {
    async createComment(postId: string, input: CreateCommentDto, commentatorInfo: {
        userId: string;
        userLogin: string
    }): Promise<CommentViewModel | null> {
        // Проверяем существование поста
        const post = await postRepository.getById(postId);
        if (!post) return null;

        // Создаём комментарий
        const newComment = await commentRepository.create(postId, input, commentatorInfo);

        // Возвращаем в правильном формате
        return {
            id: newComment.id,
            content: newComment.content,
            commentatorInfo: {
                userId: commentatorInfo.userId,
                userLogin: commentatorInfo.userLogin
            },
            createdAt: newComment.createdAt
        };
    },

    async updateComment(commentId: string, input: UpdateCommentDto): Promise<boolean> {
        return await commentRepository.update(commentId, input);
    },

    async deleteComment(commentId: string): Promise<boolean> {
        return await commentRepository.delete(commentId);
    },

    async getCommentById(commentId: string) {
        return await commentRepository.getCommentById(commentId);
    },

    async getCommentsByPostId(postId: string, query: any) {
        // При желании можно проверить существование поста
        const post = await postRepository.getById(postId);
        if (!post) return null;
        return await commentRepository.getCommentsByPostId(postId, query);
    }
};
