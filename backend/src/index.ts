import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session";

import { Env } from "./config/env.config";
import authRoutes from "./routes/auth.route";
import analyticsRoutes from "./routes/analytics.route";
import transactionRoutes from "./routes/transaction.route";
import userRoutes from "./routes/user.route";
import reportRoutes from "./routes/report.route";

dotenv.config();

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Debug incoming requests
app.use((req, res, next) => {
  console.log("🌍 Incoming request:", req.method, req.url, "from:", req.headers.origin);
  next();
});

// ✅ CORS setup
const allowedOrigins = [
  "http://localhost:5173", // Vite local dev
  "https://expense-tracker-fvk4.vercel.app", // Prod frontend
  /\.vercel\.app$/, // Any Vercel preview deployment
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server or curl
      if (
        allowedOrigins.some((o) =>
          typeof o === "string" ? o === origin : o.test(origin)
        )
      ) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Passport & session (if used)
app.use(
  session({
    secret: Env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: Env.NODE_ENV === "production" },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Backend running 🚀" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 Error:", err.message);
  res.status(500).json({ error: err.message });
});

export default app;
