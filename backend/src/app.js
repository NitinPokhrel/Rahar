import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { clerkMiddleware } from "@clerk/express";
import sequelize from "./db/db.js";

// import router 
import adminRouter from "./routes/admin.route.js";
import userRouter from "./routes/user.route.js";
import cartRouter from "./routes/cart.route.js";
import categoryRouter from "./routes/category.route.js";
import couponRouter from "./routes/coupon.route.js";
import newsletterRouter from "./routes/newsletters.route.js"; 
import orderRouter from "./routes/order.route.js";
import productRouter from "./routes/product.route.js";
import reviewRouter from "./routes/review.route.js";
import searchRouter from "./routes/search.route.js";
import wishlistRouter from "./routes/wishlist.route.js";


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

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the Admin API",
  });
});


// User routes
app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/carts", cartRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/newsletters", newsletterRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/search", searchRouter);
app.use('/api/v1/users', userRouter);
app.use("/api/v1/wishlists", wishlistRouter);


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
