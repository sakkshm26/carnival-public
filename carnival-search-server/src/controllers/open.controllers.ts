import { NextFunction, Request, Response } from "express";
import { OpenService } from "../services/open.services";
import { AppType, DocumentType } from "../db/schema";
import { fetchSlackAccessToken } from "../services/connectors/slack";
import { fetchGoogleAccessToken } from "../services/connectors/google_drive";
import { config } from "../providers/config";
import { executeRawSQL } from "../utils";
import { fetchSalesforceAccessToken } from "../services/connectors/salesforce";
import { ConnectorService } from "../services/connector.services";
import { fetchJiraAccessToken } from "../services/connectors/jira";
import { fetchConfluenceAccessToken } from "../services/connectors/confluence";

export const OpenController = {
    googleCallback: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { access_token, refresh_token } = await fetchGoogleAccessToken({ code: req.query.code as string });
            res.setHeader("Content-Type", "text/html");
            res.send(`
                <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OAuth Callback</title>
            </head>
            <body>
                <script>
                    const message = {
                        type: 'OAUTH_SUCCESS',
                        connector_type: '${AppType.GOOGLE_DRIVE}',
                        data: {
                            access_token: '${access_token}',
                            refresh_token: '${refresh_token}',
                            state: '${req.query.state}'
                        }
                    };
                    
                    if (window.opener) {
                        window.opener.postMessage(message, '${config.frontend_app_url}');
                        // Close this window after sending the message
                        window.close();
                    }
                </script>
            </body>
            </html>
            `);
        } catch (err: any) {
            next(err);
        }
    },

    slackCallback: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { user_access_token } = await fetchSlackAccessToken({ code: req.query.code as string });
            const state = JSON.parse(req.query.state as string);
            await ConnectorService.upsertUserConnector({ org_id: state.org_id, user_id: state.user_id, connector_id: state.connector_id, credentials_data: { user_access_token } })
            res.setHeader("Content-Type", "text/html");
            res.send(`
                <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OAuth Callback</title>
            </head>
            <body>
                <script>
                    const message = {
                        type: 'OAUTH_SUCCESS',
                        connector_type: '${AppType.SLACK}',
                    };
                    
                    // Send the message to the opener window
                    if (window.opener) {
                        window.opener.postMessage(message, '${config.frontend_app_url}');
                        // Close this window after sending the message
                        window.close();
                    }
                </script>
            </body>
            </html>
            `);
        } catch (err: any) {
            next(err);
        }
    },

    salesforceCallback: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { access_token, refresh_token, instance_url } = await fetchSalesforceAccessToken({ code: req.query.code as string });
            const state = JSON.parse(req.query.state as string);
            await ConnectorService.upsertUserConnector({ org_id: state.org_id, user_id: state.user_id, connector_id: state.connector_id, credentials_data: { access_token, refresh_token, instance_url } })
            res.setHeader("Content-Type", "text/html");
            res.send(`
                <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OAuth Callback</title>
            </head>
            <body>
                <script>
                    const message = {
                        type: 'OAUTH_SUCCESS',
                        connector_type: '${AppType.SALESFORCE}'
                    };
                    
                    // Send the message to the opener window
                    if (window.opener) {
                        window.opener.postMessage(message, '${config.frontend_app_url}');
                        // Close this window after sending the message
                        window.close();
                    }
                </script>
            </body>
            </html>
            `);
        } catch (err: any) {
            next(err);
        }
    },

    atlassianCallback: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const state = JSON.parse(req.query.state as string);
            if (state.app_type === AppType.JIRA) {
                const { access_token, refresh_token } = await fetchJiraAccessToken({ code: req.query.code as string });
                await ConnectorService.upsertUserConnector({ org_id: state.org_id, user_id: state.user_id, connector_id: state.connector_id, credentials_data: { access_token, refresh_token, email: state.email, base_url: state.base_url } })
            } else if (state.app_type === AppType.CONFLUENCE) {
                const { access_token, refresh_token } = await fetchConfluenceAccessToken({ code: req.query.code as string });
                await ConnectorService.upsertUserConnector({ org_id: state.org_id, user_id: state.user_id, connector_id: state.connector_id, credentials_data: { access_token, refresh_token, email: state.email, base_url: state.base_url } })
            }
            res.setHeader("Content-Type", "text/html");
            res.send(`
                <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OAuth Callback</title>
            </head>
            <body>
                <script>
                    const message = {
                        type: 'OAUTH_SUCCESS',
                    };
                    
                    // Send the message to the opener window
                    if (window.opener) {
                        window.opener.postMessage(message, '${config.frontend_app_url}');
                        // Close this window after sending the message
                        window.close();
                    }
                </script>
            </body>
            </html>
            `);
        } catch (err: any) {
            next(err);
        }
    },

    createChunk: async (req: Request, res: Response, next: NextFunction) => {
        try {
            OpenService.createChunk(req.body);
        } catch (err: any) {
            next(err);
        }
    },

    executeRawSQL: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const response = await executeRawSQL(req.body.query);
            return res.status(200).json(response);
        } catch (err: any) {
            console.log("err --->", err);
            next(err);
        }
    },

    getMetadataTypeForAppDoc: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const response = OpenService.getMetadataTypeForAppDoc(req.params.app_type as AppType, req.params.document_type as DocumentType);
            return res.status(200).json(response);
        } catch (err: any) {
            next(err);
        }
    },

    getDocumentsWithChunk: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { data } = req.query;
            const response = await OpenService.getDocumentsWithChunk(JSON.parse(data as string));
            return res.status(200).json(response);
        } catch (err: any) {
            next(err);
        }
    },

    getDocumentsWithChunksAndAppType: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { data } = req.query;
            const response = await OpenService.getDocumentsWithChunksAndAppType(JSON.parse(data as string));
            return res.status(200).json(response);
        } catch (err: any) {
            next(err);
        }
    },

    getDataFromSourceApp: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { data } = req.query;
            const response = await ConnectorService.getDataFromSourceApp({ chunks: JSON.parse(data as string) });
            return res.status(200).json(response);
        } catch (err: any) {
            next(err);
        }
    }
}