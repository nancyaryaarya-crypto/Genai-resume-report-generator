const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

/**
 * @description controller to generate interview report based on user self description, resume and job
 */

async function extractResumeText(req) {
    if (!req.file?.buffer) {
        return ""
    }

    const fileName = req.file.originalname?.toLowerCase() || ""
    const isPdf = req.file.mimetype === "application/pdf" || fileName.endsWith(".pdf")

    if (!isPdf) {
        return ""
    }

    try {
        const parser = new pdfParse.PDFParse({ data: req.file.buffer })
        const parsedPdf = await parser.getText()
        return parsedPdf.text?.trim() || ""
    } catch (error) {
        console.error("Resume PDF parsing error:", error)
        throw new Error("Unable to read uploaded resume PDF.")
    }
}

async function generateInterviewReportController(req, res) {
    const { selfDescription = "", jobDescription = "" } = req.body

    if (!jobDescription.trim()) {
        return res.status(400).json({
            message: "Job description is required."
        })
    }

    if (!selfDescription.trim() && !req.file) {
        return res.status(400).json({
            message: "Either a resume PDF or self description is required."
        })
    }

    try {
        const resumeText = await extractResumeText(req)
        const interviewReportByAi = await generateInterviewReport({
            resume: resumeText || selfDescription,
            selfDescription,
            jobDescription,
        })

        let aiReportData = interviewReportByAi

        if (typeof interviewReportByAi === "string") {
            try {
                aiReportData = JSON.parse(interviewReportByAi)
            } catch (error) {
                console.error("JSON parsing error:", error)
                aiReportData = {}
            }
        }

        if (aiReportData?.skillGap && Array.isArray(aiReportData.skillGap)) {
            aiReportData.skillGap = aiReportData.skillGap.map((skill) => ({
                ...skill,
                severity: skill.severity ? skill.severity.toLowerCase() : "low"
            }))
        }

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...aiReportData
        })

        return res.status(201).json({
            message: "Interview report generated success",
            interviewReport
        })
    } catch (error) {
        console.error("generateInterviewReportController error:", error)
        return res.status(500).json({
            message: error.message || "Failed to generate interview report."
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */

async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview reeport not found."
        })
    }

    return res.status(200).json({
        message: "interview report fetched successfully",
        interviewReport
    })
}

/**
 * @description Controller to get all interview reports logged in user.
 */

async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("title createdAt")

    return res.status(200).json({
        message: "Interview report fetched successfully",
        interviewReports
    })
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    try {
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found"
            })
        }

        const { resume = "", jobDescription = "", selfDescription = "" } = interviewReport
        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        return res.send(pdfBuffer)
    } catch (error) {
        console.error("generateResumePdfController error:", error)
        return res.status(500).json({
            message: error.message || "Failed to generate resume PDF."
        })
    }
}

module.exports = {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
}