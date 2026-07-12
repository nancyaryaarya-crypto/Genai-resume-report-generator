const express = require('express');
const cookieparser = require('cookie-parser');
const cors = require("cors")


const app = express();
app.set('trust proxy', 1);
app.use(cookieparser());

const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

const allowedOrigins = [...new Set([
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_ORIGIN,
    ...envAllowedOrigins
].filter(Boolean))]

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
            return;
        }

        callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 204
}))

const authRouter = require('./routes/auth.routes')
const interviewRouter = require("./routes/interview.routes")

 app.use('/api/auth',authRouter)
 app.use('/api/interview', interviewRouter)



module.exports = app;
