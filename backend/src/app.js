
import express from "express";
// import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js";
import { clerkMiddleware } from '@clerk/express'



const app = express();

// CORS configuration

// app.use(
//   cors({
//     origin: process.env.CORS,
//     credentials: true,
//   })
// );

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(clerkMiddleware())

// User routes
app.use('/api/v1/users', userRouter);



app.get("/",(req,res)=>{
  return res.status(200).json({
    message: "Welcome to the API",
    status: "success",
  });
})



export { app };

