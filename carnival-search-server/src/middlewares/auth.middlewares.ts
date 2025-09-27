import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { config } from "../providers/config";
import CustomError from "../providers/error";
import { ErrorType } from "../types";
import { UserService } from "../services/user.services";
import { better_auth } from "../lib/better_auth";
import { fromNodeHeaders } from "better-auth/node";

export const AuthMiddleware = {
    verifyAccessToken: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const session = await better_auth.api.getSession({
                headers: fromNodeHeaders(req.headers)
            });

            if (session?.user && session?.session) {
                const found_user = await UserService.getUser({ user_id: session.user.id });
                if (!found_user || (
                    !found_user.fk_user_last_logged_in_org &&
                    req.originalUrl !== "/internal/org/create" &&
                    req.originalUrl !== "/internal/user/add-to-org" &&
                    req.originalUrl !== "/internal/user/accept-invite" &&
                    req.originalUrl !== "/internal/user/invites"
                )) {
                    throw new CustomError("no_org_found", 401);
                }
                req.headers["user_id"] = found_user.id;
                req.headers["org_id"] = found_user.fk_user_last_logged_in_org!;
                next();
            } else {
                throw new CustomError("Unauthorized", 401);
            }
        } catch (err: any) {
            if (err.name === 'TokenExpiredError' || err.expiredAt) {
                return next(new CustomError("Access token expired", 401, ErrorType.ACCESS_TOKEN_EXPIRED));
            }
            return next(err);
        }
    },

    verifyServerKey: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const server_key = req.headers["x-server-key"];
            if (server_key !== config.server_key) {
                throw new CustomError("Unauthorized", 401);
            }
            next();
        } catch (err: any) {
            next(err);
        }
    },
}