const express = require('express');
const cookieparser = require('cookie-parser');
const cors = require("cors")


const app = express();
app.use(cookieparser());

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://genai-resume-report-generator-dnxxayyl1.vercel.app",
    "https://genai-resume-report-generator-qbdae8ere.vercel.app",
    "https://genai-resume-report-generator-pgvcahenp.vercel.app"
];

app.use(express.json());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
            return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}))

const authRouter = require('./routes/auth.routes')
const interviewRouter = require("./routes/interview.routes")

 app.use('/api/auth',authRouter)
 app.use('/api/interview', interviewRouter)



module.exports = app;
