import { ErrorType } from "../types";

export default class CustomError extends Error {
    constructor(public message: string, public status_code = 500, public error_type?: ErrorType) {
        super(message);
        this.status_code = status_code;
        this.error_type = error_type;
        Object.setPrototypeOf(this, CustomError.prototype);
    }
}