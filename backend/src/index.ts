import "dotenv/config";
import "./config/passport.config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import passport from "passport";
import { Env } from "./config/env.config";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { BadRequestException } from "./utils/app-error";
import { asyncHandler } from "./middlewares/asyncHandler.middlerware";
import connctDatabase from "./config/database.config";
import authRoutes from "./routes/auth.route";
import { passportAuthenticateJwt } from "./config/passport.config";
import userRoutes from "./routes/user.route";
import transactionRoutes from "./routes/transaction.route";
import { initializeCrons } from "./cron";
import reportRoutes from "./routes/report.route";
import analyticsRoutes from "./routes/analytics.route";

const app = express();
const BASE_PATH = Env.BASE_PATH;
console.log("BASE_PATH:", BASE_PATH);

// Parse JSON + URL Encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Init Passport
app.use(passport.initialize());

// ---------------- CORS CONFIG ----------------
const allowedOrigins = [
  "https://expense-tracker-fvk4.vercel.app", // production frontend
  "http://localhost:5173",                   // local dev
];

// Allow production + preview *.vercel.app
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (
      allowedOrigins.includes(origin) ||
      /([a-zA-Z0-9-]+\.)*vercel\.app$/.test(new URL(origin).hostname)
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// ------------------------------------------------

// Debug incoming requests (optional, helps verify CORS)
app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.path, "Origin:", req.headers.origin);
  next();
});

// ---------------- Routes ----------------
app.get(
  "/",
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    throw new BadRequestException("This is a test error");
    res.status(HTTPSTATUS.OK).json({
      message: "Hello Subscribe to the channel",
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, passportAuthenticateJwt, userRoutes);
app.use(`${BASE_PATH}/transaction`, passportAuthenticateJwt, transactionRoutes);
app.use(`${BASE_PATH}/report`, passportAuthenticateJwt, reportRoutes);
app.use(`${BASE_PATH}/analytics`, passportAuthenticateJwt, analyticsRoutes);

// Error handler
app.use(errorHandler);

// ---------------- Server Startup ----------------
app.listen(Env.PORT, async () => {
  await connctDatabase();

  if (Env.NODE_ENV === "development") {
    await initializeCrons();
  }

  console.log(`🚀 Server is running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
});
