const { GoogleGenAI } = require("@google/genai");
const {z} = require("zod")
const {zodToJsonSchema} = require ("zod-to-json-schema");
const { selfDescription, jobDescription } = require("./temp");
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY || ""
});

function requireGeminiApiKey() {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        throw new Error("GOOGLE_GENAI_API_KEY is not configured in the backend environment.")
    }
}

const interviewReportSchema = {
    type: "OBJECT",
    properties: {
        matchScore: {
            type: "NUMBER",
            description: "A score between 0 and 100 indicating how well the candidate's profile matches the job description."
        },
        technicalQuestion: {
            type: "ARRAY",
            description: "Technical questions that can be asked in the interview",
            items: {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING", description: "The technical question" },
                    intention: { type: "STRING", description: "The intention behind asking this" },
                    answer: { type: "STRING", description: "How to answer this question" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        behavioralQuestion: {
            type: "ARRAY",
            description: "Behavioral questions that can be asked in the interview",
            items: {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING", description: "The behavioral question" },
                    intention: { type: "STRING", description: "The intention behind asking this" },
                    answer: { type: "STRING", description: "How to answer this question" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        skillGap: {
            type: "ARRAY",
            description: "List of skill gaps in the candidate profile along with severity",
            items: {
                type: "OBJECT",
                properties: {
                    skill: { type: "STRING", description: "The skill which the candidate is lacking" },
                    severity: { type: "STRING", enum: ["Low", "Medium", "High"], description: "The severity of this gap" }
                },
                required: ["skill", "severity"]
            }
        },
        preparationPlan: {
            type: "ARRAY",
            description: "A day-wise preparation plan for the candidate to follow",
            items: {
                type: "OBJECT",
                properties: {
                    day: { type: "NUMBER", description: "The day number starting from 1" },
                    focus: { type: "STRING", description: "The main focus of this day" },
                    tasks: {
                        type: "ARRAY",
                        items: { type: "STRING" },
                        description: "List of tasks for this day"
                    }
                },
                required: ["day", "focus", "tasks"]
            }
        },
        title:{
            type:"STRING",
            description:"A suitable title for the interview report"
        }
    },
    required: ["matchScore", "technicalQuestion", "behavioralQuestion", "skillGap", "preparationPlan" , "title"]
};


async function generateInterviewReport ({resume,selfDescription,jobDescription}){
    requireGeminiApiKey()

    const prompt = `Generate a detailed candidate interview report strictly matching the requested JSON schema. 
    Analyze the following inputs:
    - Candidate Resume: ${resume}
    - Candidate Self Description: ${selfDescription}
    - Target Job Description: ${jobDescription}`;

    
    // const prompt = `generate an interview report for a candidate with the following details:
    //                     resume:${resume}
    //                     self describe:${selfDescription}
    //                     job describen:${jobDescription}`
    
    
    const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: interviewReportSchema // Use the custom uppercase schema here directly
    }
    });
    // const response = await ai.models.generateContent({
    //     model:"gemini-2.5-flash",
    //     contents:prompt,
    //     config:{
    //         responseMimeType:"application/json",
    //         responsejsonSchema: zodToJsonSchema(interviewReportSchema)
    //     }
    // })

    return JSON.parse(response.text)
}


function escapePdfText(value = "") {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/\r/g, "")
        .replace(/\n/g, " ")
}

function generateFallbackPdf(text = "") {
    const cleanedText = String(text || "")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim()

    const lines = cleanedText ? cleanedText.split(/\s{2,}/).slice(0, 35) : ["Resume preview unavailable."]
    const pageWidth = 595.28
    const pageHeight = 841.89

    const contentLines = lines
        .map((line, index) => {
            const safeLine = escapePdfText(line)
            return `BT /F1 11 Tf 50 ${pageHeight - 60 - index * 16} Td (${safeLine}) Tj ET`
        })
        .join("\n")

    const contentBytes = Buffer.byteLength(contentLines, "utf8")
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
        `<< /Length ${contentBytes} >>\nstream\n${contentLines}\nendstream`,
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    ]

    let pdf = "%PDF-1.4\n"
    const offsets = []

    objects.forEach((objectContent, index) => {
        offsets.push(pdf.length)
        pdf += `${index + 1} 0 obj\n${objectContent}\nendobj\n`
    })

    const xrefOffset = pdf.length
    pdf += `xref\n0 ${objects.length + 1}\n`
    pdf += "0000000000 65535 f \n"

    offsets.forEach((offset) => {
        pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
    })

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

    return Buffer.from(pdf, "binary")
}

async function generatePDFFromHtml(htmlContent){
    const launchOptions = {
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    }

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    }

    let browser

    try {
        browser = await puppeteer.launch(launchOptions)
        const page = await browser.newPage()
        await page.setContent(htmlContent || "", { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: true,
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        return pdfBuffer
    } catch (error) {
        console.error("Puppeteer PDF generation failed, using fallback PDF renderer:", error.message)
        return generateFallbackPdf(htmlContent)
    } finally {
        if (browser) {
            await browser.close().catch(() => {})
        }
    }
}



async function generateResumePdf({resume, selfDescription, jobDescription}) {
     requireGeminiApiKey()

     const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any libary like puppeteer")
     })


    const prompt = `Generate a resume for a candidate with the following details:
                        resume:${resume}
                        Self Description:${selfDescription}
                        Job Description:${jobDescription}


                        The response must be a valid JSON object with a single field "html" (or "HTML") containing a highly polished, recruiter-grade HTML resume string optimized to fit perfectly on a single A4 page.

                       Apply these exact presentation, font, and strict tight spacing structures using an embedded <style> tag:

                       1. *Global Reset & Tight Constraints (To fit on 1 Page):*
                          - Reset margins: * { margin: 0; padding: 0; box-sizing: border-box; }
                          - Body configuration: font-family: 'Arial', 'Helvetica', sans-serif; color: #222222; line-height: 1.3; background: #ffffff; padding: 15px 20px;
                          - Container bound: max-width: 750px; margin: 0 auto;

                      2. *Compact Section Spacing:*
                         - Every major section wrapper must have margin-bottom: 10px; (Strictly no huge structural gaps).
                         - Headings (<h2>): font-size: 11pt; font-weight: bold; color: #1a365d; text-transform: uppercase; border-bottom: 1px solid #1a365d; padding-bottom: 2px; margin-top: 10px; margin-bottom: 5px;

                     3. *Executive Typography:*
                        - Name Heading (<h1>): font-size: 20pt; font-weight: bold; text-align: center; margin-bottom: 3px; color: #111111;
                        - Contact Info Line: font-size: 9pt; color: #555555; text-align: center; margin-bottom: 12px;
                        - Company/Project headers: Use a clean flex layout to keep Title on left and Date on right. Font size: 9.5pt (bold for titles).
                        - Paragraphs (<p>) and Bullet Lists (<ul>/<li>): font-size: 9pt; color: #444444; margin-bottom: 2px; line-height: 1.35;
                        - Bullet Points (<li>): margin-bottom: 2px; padding-left: 3px; list-style-position: inside;

                     4. *Formatting Restrictions:*
                        - Keep description sentences crisp and short. Do not allow lines to break unnecessarily. Bold only critical technical words naturally inside text.`
                        
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents:prompt,

        config:{
            responseMimeType: "application/json",
            responseJsonSchema:zodToJsonSchema( resumePdfSchema)
        }
    })



    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePDFFromHtml(jsonContent.html || jsonContent.HTML)

    return pdfBuffer

}
   

module.exports = {generateInterviewReport, generateResumePdf};

