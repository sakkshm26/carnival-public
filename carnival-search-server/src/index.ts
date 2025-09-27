import express from "express"
import cors from "cors";
import morganMiddleware from "./middlewares/morgan.middlewares";
import UserRouter from "./routes/user.routes";
import { errorHandler } from "./middlewares/error.middlewares";
import { config } from "./providers/config";
import OrgRouter from "./routes/org.routes";
import OpenRouter from "./routes/open.routes";
import ConnectorRouter from "./routes/connector.routes";
import AdminRouter from "./routes/admin.routes";
import { initializeWorkers } from "./providers/workers";
import { toNodeHandler } from "better-auth/node";
import { better_auth } from "./lib/better_auth";

// initializeWorkers()

const app = express();

app.use(cors({
    credentials: true,
    origin: [config.frontend_app_url, config.admin_app_url],
    methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(morganMiddleware);

app.get('/health', (req, res) => {
    res.send("Carnival server running");
})

app.all("/internal/auth/*", toNodeHandler(better_auth))

app.use(express.json());

app.use('/internal/user', UserRouter)
app.use('/internal/org', OrgRouter)
app.use('/internal/connector', ConnectorRouter)
app.use('/internal/admin', AdminRouter)
app.use('/open', OpenRouter)

app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
})