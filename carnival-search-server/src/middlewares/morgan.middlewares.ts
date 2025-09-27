import morgan, {StreamOptions } from "morgan";
import Logger from "../providers/logger";

const stream: StreamOptions = {
  write: (message) => Logger.http(message),
};

const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream }
);

export default morganMiddleware;