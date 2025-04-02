import { commentRepository } from "../repositories/commentRepository";
import { CreateCommentDto, UpdateCommentDto } from "../models/commentModels";
import { postRepository } from "../repositories/postRepository";
import {Result, ResultStatus} from "../models/resultModels";

export const commentService = {
    async createComment(postId: string,
                        input: CreateCommentDto, commentatorInfo:
                        { userId: string, userLogin: string }) {
        // Проверяем, существует ли пост
        const post = await postRepository.getById(postId);
        if (!post) return null;
        const comment = await commentRepository.create(postId, input, commentatorInfo);
        return {
            id: comment.id,
            content: comment.content,
            commentatorInfo: comment.commentatorInfo,
            createdAt: comment.createdAt,
        }
    },

    async updateComment(commentId: string,
                        input: UpdateCommentDto, userId: string):
        Promise<Result<null>> {
        const comment = await commentRepository.getCommentById(commentId);
        if (!comment) {
            return {
                status: ResultStatus.NotFound,
                errorMessage: 'Comment not found',
                data: null,
                extensions: [{field: null, message: 'Comment not found'}],
            };
        }
        if (comment.commentatorInfo.userId !== userId) {
            return {
                status: ResultStatus.Forbidden,
                errorMessage: 'Forbidden',
                data: null,
                extensions: [{field: null, message: 'You are not allowed to update this comment'}],
            };
        }
        // Обновление комментария
        const updated = await commentRepository.update(commentId, input);
        if (!updated) {
            return {
                status: ResultStatus.BadRequest,
                errorMessage: 'Update failed',
                data: null,
                extensions: [{ field: 'content', message: 'Unable to update the comment' }],
            };
        }
        return {
            status: ResultStatus.Success,
            data: null,
            extensions: [],
        };

    },

    async deleteComment(commentId: string, userId: string): Promise<{ status: number, error?: string }> {
        const comment = await commentRepository.getCommentById(commentId);
        if (!comment)
            return { status: 404, error: 'Comment not found' };
        if (comment.commentatorInfo.userId !== userId)
            return { status: 403, error: 'Forbidden' };
        const deleted = await commentRepository.delete(commentId);
        return deleted ? { status: 204 } : { status: 400, error: 'Delete failed' };
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
