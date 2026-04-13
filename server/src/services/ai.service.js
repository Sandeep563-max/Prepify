import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const interviewReportSchema = z.object({
    technicalQuestions: z.array(
        z.object({
            question: z.string().describe("The technical question can be asked in the interview"),
            intentions: z.string().describe("The intention of interviewer behind asking this question"),
            answer: z.string().describe("How to answer this questions what points to cover, what approach")
        })
    ),
    behavioralQuestions: z.array(
        z.object({
            question: z.string().describe("The behavioral question can be asked in the interview"),
            intentions: z.string().describe("The intention of interviewer behind asking this question"),
            answer: z.string().describe("How to answer this questions what points to cover, what approach")
        })
    ),
    skillGaps: z.array(
        z.object({
            skill: z.string().describe("The skill which the candidate is lacking"),
            severity: z.enum(["low", "medium", "high"]).describe('The severity of the skill gap.')
        })
    ).describe("The gaps in the candidates skills that needs to be addressed."),
    preparationPlan: z.array(
        z.object({
            day: z.number().describe('The day number in the preparation plan'),
            focus: z.string().describe('The main focus or topic for this day'),
            tasks: z.array(z.string()).describe('List of specific tasks to complete on this day')
        })
    ).describe("The preparation plan for the interview"),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `Generate an interview preparation report based on the following information:
    Resume: ${resume}
    Self Description: ${selfDescription}
    Job Description: ${jobDescription}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite", 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema),
            },
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error; // Throwing it allows your controller's try/catch to handle the error properly!
    }
}

export { generateInterviewReport };