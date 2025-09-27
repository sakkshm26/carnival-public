import { NextFunction, Request, Response } from "express";
import CustomError from "../providers/error";

export const errorHandler = (err: any, req: Request, res: Response, next: any) => {
    console.error(err);
    // Handled errors
    if (err instanceof CustomError) {
        return res.status(err.status_code).send({ message: err.message, error_type: err.error_type });
    }
    // Unhandled errors
    return res.status(500).send({ message: "Internal Server Error" });
}