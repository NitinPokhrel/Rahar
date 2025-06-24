import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.routes.js';

const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.CORS,
    credentials: true
}));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// User routes
// app.use('/api/v1/users', userRouter);

export { app };