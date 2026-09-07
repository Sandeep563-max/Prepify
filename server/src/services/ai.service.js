import { GoogleGenAI } from "@google/genai";
import puppeteer from "puppeteer";
import { z } from "zod";

const interviewReportZodSchema = z.object({
    title: z.string(),
    matchScore: z.number(),
    technicalQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string()
        })
    ),
    behavioralQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string()
        })
    ),
    skillGaps: z.array(
        z.object({
            skill: z.string(),
            severity: z.string()
        })
    ),
    preparationPlan: z.array(
        z.object({
            day: z.number(),
            focus: z.string(),
            tasks: z.array(z.string())
        })
    )
});

const resumePdfZodSchema = z.object({
    html: z.string()
});

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

function isTransient503Error(error) {
    if (!error) return false;
    const status = error.status || error.code || error.statusCode;
    if (status === 503 || status === 'UNAVAILABLE' || String(status) === '503') return true;
    const message = String(error.message || '').toUpperCase();
    return message.includes('503') || message.includes('UNAVAILABLE') || message.includes('HIGH DEMAND');
}

async function generateContentWithRetry(ai, params, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await ai.models.generateContent(params);
        } catch (error) {
            if (isTransient503Error(error) && attempt < maxAttempts) {
                const delayMs = Math.pow(2, attempt - 1) * 1000;
                console.warn(`Gemini 503/UNAVAILABLE error encountered (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }
            throw error;
        }
    }
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const ai = getAIClient();

    const prompt = `You are an expert technical interviewer. Generate a strictly formatted JSON interview preparation report based on the following information. You MUST strictly follow the requested JSON schema.
    
    Resume: ${resume}
    Self Description: ${selfDescription}
    Job Description: ${jobDescription}`;

    const PRIMARY_MODEL = "gemini-3.5-flash";
    const FALLBACK_MODEL = "gemini-3.1-flash-lite";

    try {
        let response;
        console.log(`Attempting generation with primary model: ${PRIMARY_MODEL}...`);
        try {
            response = await generateContentWithRetry(ai, {
                model: PRIMARY_MODEL, 
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: interviewReportSchema,
                },
            });
        } catch (primaryError) {
            if (isTransient503Error(primaryError)) {
                console.warn(`Primary model ${PRIMARY_MODEL} failed with transient 503/UNAVAILABLE error after retries.`);
                console.log(`Attempting generation with fallback model: ${FALLBACK_MODEL}...`);
                try {
                    response = await generateContentWithRetry(ai, {
                        model: FALLBACK_MODEL,
                        contents: prompt,
                        config: {
                            responseMimeType: "application/json",
                            responseSchema: interviewReportSchema,
                        },
                    });
                    console.log(`Fallback model ${FALLBACK_MODEL} succeeded.`);
                } catch (fallbackError) {
                    console.error(`Fallback model ${FALLBACK_MODEL} failed.`);
                    throw fallbackError;
                }
            } else {
                throw primaryError;
            }
        }

        const data = JSON.parse(response.text);
        const validation = interviewReportZodSchema.safeParse(data);

        if (!validation.success) {
            console.error("Zod Validation Error for Gemini interview report response:", validation.error);
            throw new Error("Invalid response format received from AI service");
        }

        return validation.data;
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
        const response = await generateContentWithRetry(ai, {
            model: "gemini-2.5-flash", 
            contents: prompt,   
            config: {
                responseMimeType: "application/json",
                responseSchema: resumePdfSchema,
            },
        });

        const jsonContent = JSON.parse(response.text);
        const validation = resumePdfZodSchema.safeParse(jsonContent);

        if (!validation.success) {
            console.error("Zod Validation Error for Gemini resume PDF response:", validation.error);
            throw new Error("Invalid response format received from AI service");
        }

        const pdfBuffer = await generatePdfFromHtml(validation.data.html);
        return pdfBuffer;
    } catch (error) {
        console.error("PDF Generation Error:", error);
        throw error;
    }
}

export { generateInterviewReport, generateResumePdf };