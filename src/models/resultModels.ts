
export enum ResultStatus {
    Success = 'Success',
    BadRequest = 'BadRequest',
    NotFound = 'NotFound',
    Forbidden = 'Forbidden',
}

export type ExtensionType = {
    field: string | null;
    message: string;
};

export type Result<T = null> = {
    status: ResultStatus;
    errorMessage?: string;
    extensions: ExtensionType[];
    data: T;
};
