import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/user.services";

export const UserControllers = {
    /* emailPasswordSignup: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const response = await UserService.emailPasswordSignup({ email, password });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    }, */

    getUser: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user_id = req.headers.user_id as string;
            const user = await UserService.getUser({ user_id });
            return res.send(user);
        } catch (err: any) {
            next(err);
        }
    },

    getUserById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user_id = req.params.user_id;
            const user = await UserService.getUserById({ user_id });
            return res.send(user);
        } catch (err: any) {
            next(err);
        }
    },

    updateUser: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { display_name } = req.body;
            const user_id = req.headers.user_id as string;
            const user = await UserService.updateUser({ user_id, display_name });
            return res.send(user);
        } catch (err: any) {
            next(err);
        }
    },

    getOrgUsers: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const users = await UserService.getOrgUsers({ org_id });
            return res.send(users);
        } catch (err: any) {
            next(err);
        }
    },

    addUserToOrg: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { org_id, role } = req.body;
            const user_id = req.headers.user_id as string;
            await UserService.addUserToOrg({ org_id, user_id, role });
            return res.send("Success");
        } catch (err: any) {
            next(err);
        }
    },

    createUserGroup: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const { name, description, user_ids } = req.body;
            const user_group = await UserService.createUserGroup({ org_id, name, description, user_ids });
            return res.send(user_group);
        } catch (err: any) {
            next(err);
        }
    },

    getUserGroup: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user_group_id = req.params.user_group_id;
            const user_group = await UserService.getUserGroup({ user_group_id });
            return res.send(user_group);
        } catch (err: any) {
            next(err);
        }
    },

    getUserGroups: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const user_groups = await UserService.getUserGroups({ org_id });
            return res.send(user_groups);
        } catch (err: any) {
            next(err);
        }
    },

    updateUserGroup: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user_group_id = req.params.user_group_id;
            const { name, description, user_ids } = req.body;
            const user_group = await UserService.updateUserGroup({ user_group_id, name, description, user_ids });
            return res.send(user_group);
        } catch (err: any) {
            next(err);
        }
    },

    getInvites: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user_id = req.headers.user_id as string;
            const response = await UserService.getInvites({ user_id });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    acceptInvite: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { invitation_id } = req.body;
            const response = await UserService.acceptInvite({ invitation_id });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    createConversation: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const user_id = req.headers.user_id as string;
            const { user_message } = req.body;
            const response = await UserService.createConversation({ org_id, user_id });
            res.send(response);
            const title = await UserService.generateConversationTitle({ user_message });
            if (title) {
                await UserService.updateConversation({ conversation_id: response.id, title });
            }
        } catch (err: any) {
            next(err);
        }
    },

    getConversationsForUser: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const user_id = req.headers.user_id as string;
            const response = await UserService.getConversationsForUser({ org_id, user_id });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    getConversationMessages: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const conversation_id = req.params.conversation_id;
            const response = await UserService.getConversationMessages({ conversation_id });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    createReply: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const user_id = req.headers.user_id as string;
            const conversation_id = req.params.conversation_id;
            const { text, web_search } = req.body;
    
            res.setHeader('Content-Type', 'application/x-ndjson');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
    
            await UserService.createReply({
                org_id,
                user_id,
                conversation_id,
                text,
                res,
                web_search
            });
    
        } catch (err: any) {
            console.error("Error during streaming:", err);
            if (!res.headersSent) {
                next(err);
            } else {
                res.end();
            }
        }
    },

    searchConversations: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const user_id = req.headers.user_id as string;
            const { search_query } = req.body;
            const response = await UserService.searchConversations({ org_id, user_id, search_query });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    updateMessage: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { message_id } = req.params;
            const { liked } = req.body;
            const response = await UserService.updateMessage({ message_id, liked });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    }
}