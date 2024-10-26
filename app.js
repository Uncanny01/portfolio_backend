import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import dbconnection from "./database/connection.js";
import messageRouter from "./routes/messageRoutes.js";
import userRouter from "./routes/userRoutes.js";
import timelineRouter from "./routes/timelineRoutes.js";
import softwareApplicationRouter from "./routes/softwareApplicationRoutes.js";
import skillRouter from "./routes/skillRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import sectionRouter from "./routes/sectionRoutes.js";
import { errorMiddleware } from "./middlewares/error.js";

const app = express();
dotenv.config({ path: "./config/.env" });

app.use(cors({
  origin: [process.env.PORTFOLIO_URL, process.env.DASHBOARD_URL],
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/"
}))

app.use("/api/v1/user", userRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/timeline", timelineRouter);
app.use("/api/v1/softwareapplication", softwareApplicationRouter);
app.use("/api/v1/skill", skillRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/section", sectionRouter);

dbconnection();
app.use(errorMiddleware);

export default app;