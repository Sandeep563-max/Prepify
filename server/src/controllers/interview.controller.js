import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import { generateInterviewReport } from "../services/ai.service.js";
import interviewReportModel from "../models/interviewReport.model.js";    

/**
 * 
 * @desc Generate interview report based on user resume, selfdescription and job description
 * 
 * 
 */

async function generateInterviewReportController(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume file is required" });
        }
        
        const resumeContent = await pdfParse(req.file.buffer);
        
        const { selfDescription, jobDescription } = req.body;

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription
        });


        const interviewReport = await interviewReportModel.create({
            user: req.user.id, 
            resume: resumeContent.text,
            selfDescription,
            jobDescription, 
            ...interviewReportByAi,
        });

        res.status(201).json({
            message: "Interview report generated successfully",
            interviewReport: interviewReport,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "An error occurred while generating the interview report.",
            error: error.message
        });
    }
}

/**
 * @desc Get interview report by interviewID
 * 
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params;
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found" });
        }
        res.status(200).json({
            message: "Interview report fetched successfully",
            interviewReport,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "An error occurred while generating the interview report.",
            error: error.message
        });
    } 
}

async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan");

        res.status(200).json({
            message: "Interview reports fetched successfully",
            interviewReports,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "An error occurred while fetching the interview reports.",
            error: error.message
        });
    }
}

export default { generateInterviewReportController, getInterviewReportByIdController, getAllInterviewReportsController };