import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middlewares";
import { ConnectorController } from "../controllers/connector.controllers";

const ConnectorRouter = Router()

ConnectorRouter.post('/search', [AuthMiddleware.verifyAccessToken], ConnectorController.search)
ConnectorRouter.post('/', [AuthMiddleware.verifyAccessToken], ConnectorController.createConnector)
ConnectorRouter.post('/:connector_id/retry', [AuthMiddleware.verifyAccessToken], ConnectorController.retryConnector)

ConnectorRouter.get('/google-drive-folders', [AuthMiddleware.verifyAccessToken], ConnectorController.getGoogleDriveFolders)
ConnectorRouter.get('/slack-channels', [AuthMiddleware.verifyAccessToken], ConnectorController.getSlackChannels)
ConnectorRouter.get('/jira-projects', [AuthMiddleware.verifyAccessToken], ConnectorController.getJiraProjects)
ConnectorRouter.get('/confluence-spaces', [AuthMiddleware.verifyAccessToken], ConnectorController.getConfluenceSpaces)
ConnectorRouter.get('/:connector_id', [AuthMiddleware.verifyAccessToken], ConnectorController.getConnectorById)
ConnectorRouter.get('/', [AuthMiddleware.verifyAccessToken], ConnectorController.getOrgConnectors)

ConnectorRouter.put('/user-connector', [AuthMiddleware.verifyAccessToken], ConnectorController.upsertUserConnector)
ConnectorRouter.put('/:connector_id', [AuthMiddleware.verifyAccessToken], ConnectorController.updateConnector)

ConnectorRouter.delete("/:connector_id", [AuthMiddleware.verifyAccessToken], ConnectorController.deleteConnector)

export default ConnectorRouter;
