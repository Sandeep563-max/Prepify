import { GoogleGenAI } from "@google/genai";
import puppeteer from "puppeteer";

function getAIClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
    }
    
    return new GoogleGenAI({ apiKey });
}

const interviewReportSchema = {
    type: "OBJECT",
    properties: {
        title: { 
            type: "STRING", 
            description: "A concise title for the interview report." 
        },
        matchScore: { 
            type: "NUMBER", 
            description: "An overall match score percentage between 0 and 100." 
        },
        technicalQuestions: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING" },
                    intention: { type: "STRING" },
                    answer: { type: "STRING" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        behavioralQuestions: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING" },
                    intention: { type: "STRING" },
                    answer: { type: "STRING" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        skillGaps: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    skill: { type: "STRING" },
                    severity: { type: "STRING", description: "low, medium, or high" }
                },
                required: ["skill", "severity"]
            }
        },
        preparationPlan: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    day: { type: "NUMBER" },
                    focus: { type: "STRING" },
                    tasks: { 
                        type: "ARRAY", 
                        items: { type: "STRING" } 
                    }
                },
                required: ["day", "focus", "tasks"]
            }
        }
    },
    required: ["title", "matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan"]
};

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const ai = getAIClient();

    const prompt = `You are an expert technical interviewer. Generate a strictly formatted JSON interview preparation report based on the following information. You MUST strictly follow the requested JSON schema.
    
    Resume: ${resume}
    Self Description: ${selfDescription}
    Job Description: ${jobDescription}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite", 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: interviewReportSchema,
            },
        });

        const data = JSON.parse(response.text);
        return data;
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error; 
    }
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
    await browser.close();
    return pdfBuffer;
}

async function generateResumePdf({resume, selfDescription, jobDescription}) {
    const ai = getAIClient();

    const resumePdfSchema = {
        type: "OBJECT",
        properties: {
            html: { type: "STRING", description: "The HTML content of the resume" }
        },
        required: ["html"]
    };

    const prompt = `Generate a resume for the candidate with the following details:
    Resume: ${resume}
    Self Description: ${selfDescription}
    Job Description: ${jobDescription};

    The response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
    The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite", 
            contents: prompt,   
            config: {
                responseMimeType: "application/json",
                responseSchema: resumePdfSchema,
            },
        });

        const jsonContent = JSON.parse(response.text);
        const pdfBuffer = await generatePdfFromHtml(jsonContent.html);
        return pdfBuffer;
    } catch (error) {
        console.error("PDF Generation Error:", error);
        throw error;
    }
}

export { generateInterviewReport, generateResumePdf };