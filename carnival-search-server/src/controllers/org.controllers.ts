import { NextFunction, Request, Response } from "express";
import { OrgService } from "../services/org.services";

export const OrgController = {
    createOrg: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const response = await OrgService.createOrg(req.body);
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    getUserOrg: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers["org_id"] as string;
            const response = await OrgService.getUserOrg({ org_id });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    updateOrg: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers["org_id"] as string;
            const { name } = req.body;
            const response = await OrgService.updateOrg({ org_id, name });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    createUserInvite: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const { email, role } = req.body;
            const response = await OrgService.createUserInvite({ org_id, email, role });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    deleteUserInvite: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const invitation_id = req.params.invitation_id;
            const response = await OrgService.deleteUserInvite({ invitation_id });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    listInvitedUsers: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const users = await OrgService.listInvitedUsers({ org_id });
            return res.send(users);
        } catch (err: any) {
            next(err);
        }
    },
}