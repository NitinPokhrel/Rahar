import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./db/db.js";

// import router
import userRouter from "./routes/user.route.js";
import cartRouter from "./routes/cart.route.js";
import categoryRouter from "./routes/category.route.js";
import couponRouter from "./routes/coupon.route.js";

import orderRouter from "./routes/order.route.js";
import productRouter from "./routes/product.route.js";
import reviewRouter from "./routes/review.route.js";
import searchRouter from "./routes/search.route.js";
import wishlistRouter from "./routes/wishlist.route.js";
import authRouter from "./routes/auth.route.js";
import { authMiddleware } from "./middleware/auth.middleware.js";

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

app.get("/test", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the Admin API",
  });
});

// API routes

app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/categories", categoryRouter);

app.use("/api/v1/coupons", authMiddleware, couponRouter);
app.use("/api/v1/carts", authMiddleware, cartRouter);

app.use("/api/v1/orders", authMiddleware, orderRouter);
app.use("/api/v1/reviews", authMiddleware, reviewRouter);

app.use("/api/v1/search", authMiddleware, searchRouter);
app.use("/api/v1/wishlists", authMiddleware, wishlistRouter);

// Database connection and server startup
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("✅ Database tables synced successfully.");
    return sequelize.authenticate();
  })
  .then(() => {
    console.log("✅ Database connection authenticated successfully.");
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database error:", err);
    process.exit(1);
  });

export { app };
