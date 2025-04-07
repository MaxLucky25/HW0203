import { Router, Request, Response } from 'express';
import { jwtAuthMiddleware } from '../middlewares/jwtAuthMiddleware';
import { inputCheckErrorsMiddleware } from '../middlewares/validationMiddleware';
import { commentService } from '../services/commentService';
import { commentValidators } from '../validators/commentValidators';
import { ResultStatus } from '../models/resultModels';

export const commentRouter = Router();

// Обновление комментария
commentRouter.put('/:commentId',
    jwtAuthMiddleware,
    commentValidators,
    inputCheckErrorsMiddleware,
    async (req: Request, res: Response) => {
        const { commentId } = req.params;
        const userId = req.userId!;
        const result = await commentService.updateComment(commentId, { content: req.body.content }, userId);

        if (result.status === ResultStatus.Success) {
            res.sendStatus(204); // Успешно обновлено
        } else if (result.status === ResultStatus.Forbidden) {
            res.sendStatus(403); // Нет прав
        } else {
            res.sendStatus(404); // Не найден
        }
    }
);

// Удаление комментария
commentRouter.delete('/:commentId',
    jwtAuthMiddleware,
    async (req: Request, res: Response) => {
        const { commentId } = req.params;
        const userId = req.userId!;

        const result = await commentService.deleteComment(commentId, userId);
        res.sendStatus(result.status); // 204, 403 или 404 в зависимости от ситуации
    }
);

// Получение комментария по id
commentRouter.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const comment = await commentService.getCommentById(id);

    if (comment) {
        res.status(200).json(comment);
    } else {
        res.sendStatus(404);
    }
});
