const pdfParse = require("pdf-parse")
const {generateInterviewReport, generateResumePdf} = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const { jobDescription } = require("../services/temp")

/**
 * @description controller to generate interview report based on user on user self description, resume and job

 */


async function generateInterviewReportController(req,res) {
   

    const resumeContent = await( new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
    const {selfDescription , jobDescription} = req.body

    const interviewReportByAi = await generateInterviewReport({
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
    })

    let aiReportData = interviewReportByAi;
   if (typeof interviewReportByAi === 'string') {
      try {
        aiReportData = JSON.parse(interviewReportByAi);
      } catch (e) {
        console.error("JSON parsing error:", e);
      }
    }

    if (aiReportData && aiReportData.skillGap && Array.isArray(aiReportData.skillGap)) {
      aiReportData.skillGap = aiReportData.skillGap.map(skill => ({
        ...skill,
        severity: skill.severity ? skill.severity.toLowerCase() : 'low'
      }));
    }

  
    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
        ...aiReportData
        // ...interviewReportByAi
    })

    res.status(201).json({
        message:"Interview  report generated success",
        interviewReport
    })
}

/**
 * @description Controller to get interview report by interviewId.
 */

async function getInterviewReportByIdController(req,res){
    const {interviewId} = req.params

    const interviewReport = await interviewReportModel.findOne({ _id:interviewId, user:req.user.id})

    if(!interviewReport) {
        return res.status(404).json({
            message:"Interview reeport not found."
        })
    }
    res.status(200).json({
        message:"interview report fetched successfully",

        interviewReport
    })

}


/**
 * @description Controller to get all interview reports logged in user.
 */

async function getAllInterviewReportsController(req,res){
      const interviewReports = await interviewReportModel
      .find({user:req.user.id})
      .sort({createdAt:-1})
      .select("title createdAt")
    //   ("-resume -selfDescription-jobDescription -_v -technicalQuestions -behavioralQuestions - skillGaps -preparationPlan")

      res.status(200).json({
        message:"Interview report fetched successfully",
        interviewReports
      })
}

/**
 * @description Controller to generate resume PDF  based on user self description , resume and job description
 */
async function generateResumePdfController (req,res) {
    const {interviewReportId} = req.params 
    
    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if(!interviewReport) {
        return res.status(404) .json ({
            message: "Interview report not found"
        })
    }

    const {resume, jobDescription, selfDescription} = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription})

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition" : `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = {generateInterviewReportController, getInterviewReportByIdController,getAllInterviewReportsController,generateResumePdfController}