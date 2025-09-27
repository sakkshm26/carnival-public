import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middlewares";
import { AdminController } from "../controllers/admin.controllers";

const AdminRouter = Router();

AdminRouter.get("/orgs", [AuthMiddleware.verifyAccessToken], AdminController.getOrgs);
AdminRouter.get("/org/:org_id", [AuthMiddleware.verifyAccessToken], AdminController.getOrg);
AdminRouter.get("/:org_id/stats/total-users", [AuthMiddleware.verifyAccessToken], AdminController.getTotalUsers);
AdminRouter.get("/:org_id/stats/total-messages", [AuthMiddleware.verifyAccessToken], AdminController.getTotalMessages);
AdminRouter.get("/:org_id/stats/daily-messages", [AuthMiddleware.verifyAccessToken], AdminController.getDailyMessageCounts);
AdminRouter.get("/:org_id/stats/daily-unique-users", [AuthMiddleware.verifyAccessToken], AdminController.getDailyUniqueUserCounts);
AdminRouter.get("/:org_id/users", [AuthMiddleware.verifyAccessToken], AdminController.getUserStats);

export default AdminRouter;
