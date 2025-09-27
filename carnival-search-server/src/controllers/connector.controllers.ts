import { NextFunction, Request, Response } from "express";
import { ConnectorService } from "../services/connector.services";
import { getGoogleDriveFolders } from "../services/connectors/google_drive";

export const ConnectorController = {
    search: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const user_id = req.headers.user_id as string;
            const { query_text } = req.body;
            const response = await ConnectorService.search({ org_id, user_id, query_text });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    getOrgConnectors: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const user_id = req.headers.user_id as string;
            const response = await ConnectorService.getOrgConnectors({ org_id, user_id });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    createConnector: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user_id = req.headers.user_id as string;
            const org_id = req.headers.org_id as string;
            const { connector_name, app_type, connector_data } = req.body;
            await ConnectorService.createConnector({ org_id, user_id, connector_name, app_type, connector_data });
            return res.send("Creating connector");
        } catch (err: any) {
            next(err);
        }
    },

    retryConnector: async (req: Request, res: Response, next: NextFunction) => {
        /* try {
            const { connector_id } = req.params;
            const response = await ConnectorService.retryConnector({ connector_id });
            return res.send(response);
        } catch (err: any) {
            next(err);
        } */
    },

    getConnectorById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user_id = req.headers.user_id as string;
            const { connector_id } = req.params;
            const response = await ConnectorService.getConnectorById({ connector_id, user_id });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    updateConnector: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const org_id = req.headers.org_id as string;
            const { connector_id } = req.params;
            const { name, user_access, group_access } = req.body;
            const response = await ConnectorService.updateConnector({ org_id, connector_id, name, user_access, group_access });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    deleteConnector: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { connector_id } = req.params;
            const response = await ConnectorService.deleteConnector({ connector_id });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    getGoogleDriveFolders: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const access_token = req.query.access_token as string;
            const response = await getGoogleDriveFolders({ access_token });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },

    getSlackChannels: async (req: Request, res: Response, next: NextFunction) => {
        /* try {
            const user_access_token = req.query.user_access_token as string;
            const response = await getSlackChannels({ user_access_token });
            return res.send(response);
        } catch (err: any) {
            next(err);
        } */
    },

    getJiraProjects: async (req: Request, res: Response, next: NextFunction) => {
        /* try {
            const base_url = req.query.base_url as string;
            const email = req.query.email as string;
            const access_token = req.query.access_token as string;
            const response = await getJiraProjects({ base_url, email, access_token });
            return res.send(response);
        } catch (err: any) {
            next(err);
        } */
    },

    getConfluenceSpaces: async (req: Request, res: Response, next: NextFunction) => {
        /* try {
            const base_url = req.query.base_url as string;
            const email = req.query.email as string;
            const access_token = req.query.access_token as string;
            const response = await getConfluenceSpaces({ base_url, email, access_token });
            return res.send(response);
        } catch (err: any) {
            next(err);
        } */
    },

    upsertUserConnector: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user_id = req.headers.user_id as string;
            const org_id = req.headers.org_id as string;
            const { connector_id, credentials_data } = req.body;
            const response = await ConnectorService.upsertUserConnector({ org_id, user_id, connector_id, credentials_data });
            return res.send(response);
        } catch (err: any) {
            next(err);
        }
    },
}
