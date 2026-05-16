import "./types/express-augment";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env, getCorsAllowedOrigins } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: getCorsAllowedOrigins(),
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
if (env.NODE_ENV !== "test") app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    name: "Zebvo API",
    description: "AI-powered social media content platform",
    docs: "/api/health",
  });
});

app.use("/api", apiRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

const port = env.PORT;

/* Local / traditional Node hosts (Railway, Render, etc.). Vercel Services inject Fluid Compute — do not listen inside the function bundle. */
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`\n  Zebvo API running on http://localhost:${port}`);
    console.log(`  CORS origin: ${env.CORS_ORIGIN}`);
    console.log(`  Gemini key:  ${env.GEMINI_API_KEY ? "configured" : "MISSING (set GEMINI_API_KEY)"}\n`);
  });
}

/* Vercel's Node builder resolves `module.exports` for the handler; `export default` alone can be missed. */
module.exports = app;
