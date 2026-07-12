import { getAllInterviewReports,generateInterviewReport,getInterviewReportById,generateResumePdf } from "../services/interview.api";
import { useContext, useCallback } from "react";
import { InterviewContext } from "../interview.context";



export const useInterview = () => {
    const context = useContext(InterviewContext)

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null

        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response?.interviewReport ?? null)
        } catch (err) {
            console.error(err)
            setReport(null)
        } finally {
            setLoading(false)
        }

        return response?.interviewReport ?? null
    }, [setLoading, setReport])

    const getReportById = useCallback(async (interviewId) => {
        setLoading(true)
        let response = null

        try {
            response = await getInterviewReportById(interviewId)
            if (response?.interviewReport) {
                setReport(response.interviewReport)
            } else {
                setReport(null)
            }
        } catch (err) {
            console.error(err)
            setReport(null)
        } finally {
            setLoading(false)
        }

        return response?.interviewReport ?? null
    }, [setLoading, setReport])

    const getReports = useCallback(async () => {
        setLoading(true)
        let response = null

        try {
            response = await getAllInterviewReports()
            if (response?.interviewReports) {
                setReports(response.interviewReports)
            } else {
                setReports([])
            }
        } catch (err) {
            console.error(err)
            setReports([])
        } finally {
            setLoading(false)
        }

        return response?.interviewReports || []
    }, [setLoading, setReports])

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)

        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([response], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            return true
        } catch (error) {
            console.error(error)
            return false
        } finally {
            setLoading(false)
        }
    }

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }
}