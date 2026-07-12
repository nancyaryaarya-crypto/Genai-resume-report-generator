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

    
  
    
    
    const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: interviewReportSchema // Use the custom uppercase schema here directly
    }
    });
  

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

function normalizeResumeHtmlForPdf(htmlContent = "") {
    const rawHtml = String(htmlContent || "").trim()

    const cleanedHtml = rawHtml
        .replace(/^<!doctype html[^>]*>/i, "")
        .replace(/^<html[^>]*>/i, "")
        .replace(/<\/html>$/i, "")
        .replace(/^<body[^>]*>/i, "")
        .replace(/<\/body>$/i, "")
        .replace(/^<head[^>]*>[\s\S]*?<\/head>/i, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .trim()

    const innerContent = cleanedHtml
        .replace(/^<div class="resume-page"[^>]*>/i, "")
        .replace(/<\/div>$/i, "")
        .trim()

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 794px !important;
      max-width: 794px !important;
      min-width: 794px !important;
      margin: 0 !important;
      padding: 20px !important;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: #222222;
      line-height: 1.3;
      overflow: visible !important;
      display: block !important;
    }
    .resume-page {
      width: 794px !important;
      max-width: 794px !important;
      min-width: 794px !important;
      min-height: 1123px !important;
      margin: 0 auto;
      padding: 20px;
      background: #ffffff;
      display: block !important;
      overflow: visible !important;
      box-shadow: none !important;
      position: static !important;
      transform: none !important;
    }
    .resume-page, .resume-container, .container, div, section, article, main, header, footer, ul, li, p, h1, h2, h3, span {
      max-width: 794px !important;
      overflow: visible !important;
      position: static !important;
      transform: none !important;
      flex-shrink: 0 !important;
    }
    @page {
      size: A4;
      margin: 0;
    }
    @media print {
      html, body {
        width: 794px !important;
        max-width: 794px !important;
        min-width: 794px !important;
        margin: 0 !important;
        padding: 20px !important;
        background: #fff !important;
        overflow: visible !important;
      }
      .resume-page {
        width: 794px !important;
        max-width: 794px !important;
        min-width: 794px !important;
        min-height: 1123px !important;
        margin: 0 !important;
        padding: 20px !important;
        overflow: visible !important;
        box-shadow: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="resume-page">
    ${innerContent}
  </div>
</body>
</html>`
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

        await page.setViewport({
            width: 1240,
            height: 1754,
            deviceScaleFactor: 1
        })

        await page.emulateMediaType("print")

        const normalizedHtml = normalizeResumeHtmlForPdf(htmlContent)

        await page.setContent(normalizedHtml, {
            waitUntil: ["load", "domcontentloaded", "networkidle0"],
            timeout: 120000
        })

        await page.waitForNetworkIdle({ idleTime: 500 })

        await page.evaluate(async () => {
            if (document.fonts?.ready) {
                await document.fonts.ready
            }

            document.documentElement.style.width = '794px'
            document.documentElement.style.maxWidth = '794px'
            document.documentElement.style.minWidth = '794px'
            document.documentElement.style.overflow = 'visible'
            document.body.style.width = '794px'
            document.body.style.maxWidth = '794px'
            document.body.style.minWidth = '794px'
            document.body.style.display = 'block'
            document.body.style.margin = '0'
            document.body.style.padding = '20px'
            document.body.style.boxSizing = 'border-box'
            document.body.style.overflow = 'visible'
            document.body.style.transform = 'none'
            document.body.style.zoom = '1'
        })

        await page.addStyleTag({
            content: 'html, body { width: 794px !important; max-width: 794px !important; min-width: 794px !important; overflow: visible !important; display: block !important; margin: 0 !important; padding: 20px !important; box-sizing: border-box !important; } html, body, .resume-page, .resume-container, .container, div, section, article, main, header, footer, ul, li, p, h1, h2, h3, span { max-width: 794px !important; flex-shrink: 0 !important; overflow: visible !important; position: static !important; transform: none !important; } * { box-sizing: border-box !important; }'
        })

        const pdfBuffer = await page.pdf({
            printBackground: true,
            width: '794px',
            height: '1123px',
            preferCSSPageSize: false,
            scale: 1,
            displayHeaderFooter: false,
            margin: {
                top: "0px",
                bottom: "0px",
                left: "0px",
                right: "0px"
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


                        The response must be a valid JSON object with a single field "html" (or "HTML") containing a plain HTML resume string optimized to fit on one A4 page with no layout collapse.

                        CRITICAL OUTPUT RULES:
                        - Return only a raw HTML string with an embedded <style> block.
                        - Do NOT use Tailwind classes, external CSS, external fonts, or JavaScript.
                        - Do NOT use CSS grid, CSS zoom, transforms, or absolute positioning.
                        - Do NOT use nested flex layouts or huge width values.
                        - Use a single top-level wrapper like <div class="resume-page">.
                        - Use only simple block-level HTML sections with semantic tags like <div>, <section>, <p>, <ul>, <li>, <h1>, <h2>.

                        Apply these exact print-safe styles inside the <style> tag:

                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        @page { size: A4; margin: 0; }
                        html, body { margin: 0; padding: 0; background: #ffffff; font-family: Arial, Helvetica, sans-serif; color: #222222; line-height: 1.3; overflow: visible; }
                        body { width: 794px; max-width: 794px; min-width: 794px; display: block; }
                        .resume-page { width: 794px; max-width: 794px; min-width: 794px; min-height: 1123px; margin: 0 auto; padding: 20px; background: #ffffff; display: block !important; box-shadow: none; overflow: visible; }
                        .section, .entry, .summary-item, .project-card, .skills-list, .row, .entry-top { display: block !important; width: 100% !important; max-width: 100% !important; min-width: 0 !important; }
                        @media print { html, body { margin: 0; padding: 0; background: #fff; } .resume-page { width: 794px !important; max-width: 794px !important; min-width: 794px !important; min-height: 1123px !important; margin: 0 !important; padding: 20px !important; display: block !important; box-shadow: none !important; overflow: visible !important; } * { box-sizing: border-box !important; } }

                        Typography and spacing rules:
                        - h1: font-size: 20pt; font-weight: bold; text-align: center; margin-bottom: 3px;
                        - h2: font-size: 11pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1a365d; padding-bottom: 2px; margin-top: 10px; margin-bottom: 5px;
                        - p, li: font-size: 9pt; line-height: 1.35; margin-bottom: 2px;
                        - Keep all content concise and fit on one page without overflow or horizontal collapse.
                        - Use short, clean sentences and avoid wide tables, huge lists, or multi-column layout.
                        - Each section should be block-based and should not rely on flexbox to stay stable in print.`
                        
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

