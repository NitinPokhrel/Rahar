const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');


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

module.exports = { app };