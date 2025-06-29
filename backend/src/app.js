import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import adminRouter from "./routes/admin.route.js";
import { clerkMiddleware } from "@clerk/express";
import sequelize from "./db/db.js";

const PORT = process.env.PORT || 8000;

const app = express();

// CORS configuration

app.use(
  cors({
    origin: process.env.CORS,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(clerkMiddleware());

app.get("/test", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the Admin API",
  });
});


// User routes
app.use("/api/v1/admin", adminRouter);

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("table synced successfully.");
  })
  .catch((err) => {
    console.error("Failed to sync table:", err);
  });

sequelize
  .authenticate()
  .then(() => {
    app.listen(8000 || process.env.PORT, () => {
      console.log("server is running on port " + process.env.PORT);
    });
  })
  .catch((error) => {
    console.log("failed to connect database", error);
  });

export { app };
