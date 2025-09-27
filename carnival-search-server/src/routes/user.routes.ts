import { Router } from "express";
import { UserControllers } from "../controllers/user.controllers";
import { AuthMiddleware } from "../middlewares/auth.middlewares";

const UserRouter = Router();

// UserRouter.post("/signup", UserControllers.emailPasswordSignup);
UserRouter.post("/add-to-org", [AuthMiddleware.verifyAccessToken], UserControllers.addUserToOrg);
UserRouter.post("/user-group", [AuthMiddleware.verifyAccessToken], UserControllers.createUserGroup);
UserRouter.post("/accept-invite", [AuthMiddleware.verifyAccessToken], UserControllers.acceptInvite);
UserRouter.post("/conversation", [AuthMiddleware.verifyAccessToken], UserControllers.createConversation);
UserRouter.post("/generate-reply/:conversation_id", [AuthMiddleware.verifyAccessToken], UserControllers.createReply);
UserRouter.post("/search-conversations", [AuthMiddleware.verifyAccessToken], UserControllers.searchConversations);

UserRouter.get("/org-users", [AuthMiddleware.verifyAccessToken], UserControllers.getOrgUsers);
UserRouter.get("/user-group", [AuthMiddleware.verifyAccessToken], UserControllers.getUserGroups);
UserRouter.get("/user-group/:user_group_id", [AuthMiddleware.verifyAccessToken], UserControllers.getUserGroup);
UserRouter.get("/invites", [AuthMiddleware.verifyAccessToken], UserControllers.getInvites);
UserRouter.get("/", [AuthMiddleware.verifyAccessToken], UserControllers.getUser);
UserRouter.get("/conversations", [AuthMiddleware.verifyAccessToken], UserControllers.getConversationsForUser);
UserRouter.get("/conversations/:conversation_id/messages", [AuthMiddleware.verifyAccessToken], UserControllers.getConversationMessages);
UserRouter.get("/:user_id", [AuthMiddleware.verifyAccessToken], UserControllers.getUserById);

UserRouter.put("/user-group/:user_group_id", [AuthMiddleware.verifyAccessToken], UserControllers.updateUserGroup);
UserRouter.put("/", [AuthMiddleware.verifyAccessToken], UserControllers.updateUser);
UserRouter.put("/message/:message_id", [AuthMiddleware.verifyAccessToken], UserControllers.updateMessage);

export default UserRouter;