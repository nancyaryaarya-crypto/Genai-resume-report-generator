import { getAllInterviewReports,generateInterviewReport,getInterviewReportById,generateResumePdf } from "../services/interview.api";
import { useContext, useCallback } from "react";
import { InterviewContext } from "../interview.context";



export const useInterview = () =>{
    const context = useContext(InterviewContext)

    if(!context){
        throw new Error("useInterview must be used within an InterviewProvider")
    
    }
    
    const {loading , setLoading , report , setReport , reports , setReports}= context

    const generateReport = useCallback(async ({jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null
        try{
            response = await generateInterviewReport({jobDescription, selfDescription, resumeFile})
           setReport(response.interviewReport)
        }catch (err){
            console.log(err)

        }finally {
            setLoading(false)
        }

        return response.interviewReport
    }, [setLoading, setReport])


    const getReportById = useCallback(async (interviewId) => {
       setLoading(true)
       let response = null
      try {
           response = await getInterviewReportById(interviewId)
        // Check if response and response.interviewReport exist
          if (response && response.interviewReport) {
            setReport(response.interviewReport)
          } else {
            setReport(null)
          }
        } catch (err) {
        console.log(err)
            setReport(null) // Error aane par safe fallback
       } finally {
        setLoading(false)
       }
    
       return response?.interviewReport || null
    }, [setLoading, setReport])


    const getReports = useCallback(async () => {
       setLoading(true)
       let response = null
       try {
            response = await getAllInterviewReports()
        // Check if response and interviewReports exist
            if (response && response.interviewReports) {
            setReports(response.interviewReports)
           } else {
            setReports([]) // Fallback to empty array
           }
        } catch (err) {
        console.log(err)
             setReports([]) // Error aane par page khali rahega, crash nahi hoga
       } finally {
        setLoading(false)
       }
       return response?.interviewReports || []
    }, [setLoading, setReports])

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        let response = null
        try{
            response = await  generateResumePdf({interviewReportId})
            const url = window.URL.createObjectURL(new Blob([ response ], {type: "application/pdf"}))
            const link = document.createElement("a")
            link.href = url 
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            link.click()

    }catch(error){
        console.log(error)
    } finally{
        setLoading(false)
    }
    }

    return {loading , report, reports, generateReport, getReportById, getReports, getResumePdf}

}