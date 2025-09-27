import { NextFunction, Request, Response } from "express";
import { AdminService } from "../services/admin.services";
import { OrgService } from "../services/org.services";

export const AdminController = {
    getOrgs: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const orgs = await OrgService.getAllOrgs();
            res.send(orgs);
        } catch (err) {
            next(err);
        }
    },

    getOrg: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.params.org_id as string;
            const org = await OrgService.getOrg({ org_id });
            res.send(org);
        } catch (err) {
            next(err);
        }
    },

    getTotalUsers: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.params.org_id as string;
            const count = await AdminService.getTotalUsers({ org_id });
            res.send({ count });
        } catch (err) {
            next(err);
        }
    },

    getTotalMessages: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.params.org_id as string;
            const count = await AdminService.getTotalMessages({ org_id });
            res.send({ count });
        } catch (err) {
            next(err);
        }
    },

    getDailyMessageCounts: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.params.org_id as string;
            const daysParam = req.query.days as string | undefined;
            const parsed = daysParam ? parseInt(daysParam, 10) : NaN;
            const days = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
            const data = await AdminService.getDailyMessageCounts({ org_id, days });
            res.send(data);
        } catch (err) {
            next(err);
        }
    },

    getDailyUniqueUserCounts: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.params.org_id as string;
            const daysParam = req.query.days as string | undefined;
            const parsed = daysParam ? parseInt(daysParam, 10) : NaN;
            const days = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
            const data = await AdminService.getDailyUniqueUserCounts({ org_id, days });
            res.send(data);
        } catch (err) {
            next(err);
        }
    },

    getUserStats: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.params.org_id as string;
            const data = await AdminService.getUserStats({ org_id });
            res.send(data);
        } catch (err) {
            next(err);
        }
    }
}