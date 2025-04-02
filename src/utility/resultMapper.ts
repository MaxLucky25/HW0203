import { ResultStatus } from '../models/resultModels';

export const resultCodeToHttpStatus = (status: ResultStatus): number => {
    switch (status) {
        case ResultStatus.Success:
            return 200;
        case ResultStatus.BadRequest:
            return 400;
        case ResultStatus.NotFound:
            return 404;
        case ResultStatus.Forbidden:
            return 403;
        default:
            return 400;
    }
};
