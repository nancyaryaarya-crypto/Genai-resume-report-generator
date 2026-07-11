const express = require ("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")



const interviewRouter = express.Router()



/**
 * @route Post /api/interview
 * @description genrate new interview report on the basis of user self 
 * @access Private 
 */

interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"),interviewController.generateInterviewReportController)


/**
 * @route get /api/interview/report/:interview
 * @description genrate new interview report on the basis of user self 
 * @access Private 
 */


interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController. getInterviewReportByIdController)

/**
 * @route get /api/interview/
 * @description genrate new interview report on the basis of user self 
 * @access Private 
 */

interviewRouter.get("/", authMiddleware.authUser, interviewController. getAllInterviewReportsController)

/**
 * @route Get/api/interview/resume/pdf 
 * @description generate resume pdf 
 * @access private 
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)

module.exports = interviewRouter