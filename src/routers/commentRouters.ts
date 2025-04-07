import { Router, Request, Response } from 'express';
import { jwtAuthMiddleware } from '../middlewares/jwtAuthMiddleware';
import { inputCheckErrorsMiddleware } from '../middlewares/validationMiddleware';
import { commentService } from '../services/commentService';
import { commentValidators } from '../validators/commentValidators';




export const commentRouter = Router();

//обновление комментария
commentRouter.put('/:commentId',
    jwtAuthMiddleware,
    commentValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response) => {
        const { commentId } = req.params;
        const userId = req.userId!;
        const updatedComment = await commentService.updateComment(commentId, { content: req.body.content }, userId);

        if (updatedComment) {
            res.sendStatus(204); // Комментарий обновлен, без контента в ответе
        } else {
            res.sendStatus(404); // Комментарий не найден
        }
    }
);

//удаление комментария
commentRouter.delete('/:commentId',
    jwtAuthMiddleware,
    async (req: Request, res: Response) => {
        const { commentId } = req.params;
        const userId = req.userId!;

        const deleted = await commentService.deleteComment(commentId, userId);

        if (deleted) {
            res.sendStatus(204); // Комментарий удален, без контента в ответе
        } else {
            // Проверка прав доступа, если удаление не удалось из-за отсутствия прав
            const isAuthor = await commentService.getCommentsByPostId(commentId, userId); // Допустим, есть метод для проверки, является ли пользователь автором
            if (isAuthor) {
                res.sendStatus(404); // Комментарий не найден
            } else {
                res.sendStatus(403); // Пользователь не авторизован для удаления
            }
        }
    }
);

// получение комментария по id
commentRouter.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const comment = await commentService.getCommentById(id);
    comment ? res.status(200).json(comment) : res.sendStatus(404);
});
