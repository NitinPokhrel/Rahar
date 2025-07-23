import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./db/db.js";

// import router
import adminRouter from "./routes/admin.route.js";
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

// this will be removed later while authentication operation are carried out
const createUserExample = {
  clerkUserId: "user_2abc123def453",
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  firstName: "Photo",
  lastName: "Test",
  email: "john121.doe@example.com",
  password: "securePassword123",
  phone: "+1234567890",
  dateOfBirth: "1990-05-15",
  gender: "male",
  role: "admin",
  permissions: ["manageUsers", "manageProducts", "manageOrders"],
  address: {
    province: "California",
    city: "Los Angeles",
    fullAddress: "123 Main Street, Apt 4B, Los Angeles, CA 90210",
  },
};

async function authenticateUser(req, res, next) {
  req.user = createUserExample;
  next();
}

app.use(authenticateUser);

// API routes
app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/carts", cartRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/coupons", couponRouter);

app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/wishlists", wishlistRouter);

// Database connection and server startup
sequelize
  .sync({ force: true })
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
