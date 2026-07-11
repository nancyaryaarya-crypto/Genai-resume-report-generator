const express = require('express');
const cookieparser = require('cookie-parser');
const cors = require("cors")


const app = express();
app.use(cookieparser());

app.use(express.json());
app.use(cors({
    origin:[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://genai-resume-report-generator-dnxxayyl1.vercel.app",
        "https://genai-resume-report-generator-qbdae8ere.vercel.app"

    ],
    methods:[ 'GET', 'POST','PUT', 'DELETE'],
    credentials:true
}))

const authRouter = require('./routes/auth.routes')
const interviewRouter = require("./routes/interview.routes")

 app.use('/api/auth',authRouter)
 app.use('/api/interview', interviewRouter)



module.exports = app;
