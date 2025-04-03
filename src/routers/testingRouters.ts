import { Router } from 'express';
import {blogCollection, commentCollection, postCollection, userCollection} from "../db/mongo-db";
import {authService} from "../services/authService";



export const testingRouters = Router();

testingRouters.delete('/all-data', async (req, res) => {
    await blogCollection.deleteMany({});
    await postCollection.deleteMany({});
    await userCollection.deleteMany({});
    await commentCollection.deleteMany({})
    res.sendStatus(204);
});


// Новые эндпоинты для тестов
if (process.env.NODE_ENV === 'test') {
    // Получить последний код подтверждения
    testingRouters.get('/last-confirmation-code', async (req, res) => {
        const user = await userCollection.findOne({});
        res.status(200).json({ code: user?.emailConfirmation.confirmationCode });
    });

    // Подтвердить email без письма
    testingRouters.post('/confirm-email', async (req, res) => {
        const { code } = req.body;
        const result = await authService.confirmRegistration(code);
        result ? res.sendStatus(204) : res.sendStatus(400);
    });


}