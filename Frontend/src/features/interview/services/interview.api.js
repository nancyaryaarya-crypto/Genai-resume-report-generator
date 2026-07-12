import axios from "axios";
// import { jobDescription, selfDescription } from "../../../../../Backend/src/services/temp";

const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://genai-resume-report-generator.onrender.com" : "http://localhost:3000")).replace(/\/$/, "")

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
})


/**
 * @description service to generate interview report based on user self description, resume and job
 */


export const generateInterviewReport =  async ({jobDescription,selfDescription,resumeFile}) => {

    const formData = new FormData()
    formData.append("jobDescription",jobDescription)
    formData.append("selfDescription", selfDescription)
    formData.append("resume", resumeFile)

    const response = await api.post ("/api/interview/", formData)
        // headers:{
      //     "Content-Type": "multipart/form-data"
        // }
   

    return response.data
}


/**
 * @description service to get interview report by interviewId
 */
export  const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response .data 
}

/**
 * @description service to get all interview  report of logged in user.
 */

export  const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview")

    return response .data 
}


/**
 * @description service to generate resume pdf based on user 
 */

export const generateResumePdf = async ({ interviewReportId})=>{
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null,{
         responseType: "arraybuffer"
    })

    return response.data
}