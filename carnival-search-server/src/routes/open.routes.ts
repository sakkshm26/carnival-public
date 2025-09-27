import { Router } from "express";
import { OpenController } from "../controllers/open.controllers";
import { AuthMiddleware } from "../middlewares/auth.middlewares";
import { AppType } from "../db/schema";

const OpenRouter = Router();

OpenRouter.get(`/${AppType.GOOGLE_DRIVE}/callback`, OpenController.googleCallback)
OpenRouter.get(`/${AppType.SLACK}/callback`, OpenController.slackCallback)
OpenRouter.get(`/${AppType.SALESFORCE}/callback`, OpenController.salesforceCallback)
OpenRouter.get(`/atlassian/callback`, OpenController.atlassianCallback)
OpenRouter.get('/metadata-type/:app_type/:document_type', [AuthMiddleware.verifyServerKey], OpenController.getMetadataTypeForAppDoc)
OpenRouter.get('/documents-with-chunk', [AuthMiddleware.verifyServerKey], OpenController.getDocumentsWithChunk)
OpenRouter.get('/documents-with-chunks-and-app-type', [AuthMiddleware.verifyServerKey], OpenController.getDocumentsWithChunksAndAppType)
OpenRouter.get('/data-from-source-app', [AuthMiddleware.verifyServerKey], OpenController.getDataFromSourceApp)

OpenRouter.post("/document-chunk", [AuthMiddleware.verifyServerKey], OpenController.createChunk)
OpenRouter.post("/raw-sql", [AuthMiddleware.verifyServerKey], OpenController.executeRawSQL)

export default OpenRouter;