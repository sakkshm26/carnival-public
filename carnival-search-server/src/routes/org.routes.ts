import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middlewares";
import { OrgController } from "../controllers/org.controllers";

const OrgRouter = Router();

OrgRouter.post("/create", [AuthMiddleware.verifyAccessToken], OrgController.createOrg)
OrgRouter.post("/user-invites", [AuthMiddleware.verifyAccessToken], OrgController.createUserInvite)

OrgRouter.get("/", [AuthMiddleware.verifyAccessToken], OrgController.getUserOrg)
OrgRouter.get("/user-invites", [AuthMiddleware.verifyAccessToken], OrgController.listInvitedUsers)

OrgRouter.put("/", [AuthMiddleware.verifyAccessToken], OrgController.updateOrg)

OrgRouter.delete("/user-invites/:invitation_id", [AuthMiddleware.verifyAccessToken], OrgController.deleteUserInvite)

export default OrgRouter;