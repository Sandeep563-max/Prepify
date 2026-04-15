import pdfParse from "pdf-extraction"; 
import { generateInterviewReport, generateResumePdf } from "../services/ai.service.js";
import interviewReportModel from "../models/interviewReport.model.js";    

async function generateInterviewReportController(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume file is required" });
        }
        
        // Parse the PDF using the modern, ESM-friendly library
        const resumeContent = await pdfParse(req.file.buffer);
        const { selfDescription, jobDescription } = req.body;

        // Generate the report content via Gemini AI
        const interviewReportByAi = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription
        });

        // 🚀 FIX: Save to MongoDB with the required title field!
        const interviewReport = await interviewReportModel.create({
            user: req.user.id, 
            title: interviewReportByAi.title || "Custom Interview Plan", 
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
        console.error("============= BACKEND CRASH =============");
        console.error(error);
        res.status(500).json({
            message: "An error occurred while generating the interview report.",
            error: error.message
        });
    }
}

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
            message: "An error occurred while fetching the interview report.",
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

async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;
        const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id });

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found" });
        }

        const { selfDescription, resume, jobDescription } = interviewReport;
        const pdfBuffer = await generateResumePdf({ selfDescription, resume, jobDescription });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=resume_${interviewReportId}.pdf`,
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "An error occurred while generating the PDF.",
            error: error.message
        });
    }
}

export default { generateInterviewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController };