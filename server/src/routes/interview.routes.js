import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js'; // This IS the authUser function
import interviewController from '../controllers/interview.controller.js';
import upload from '../middlewares/file.middleware.js';


const interviewRouter = express.Router();

/**
 * @route POST /api/interview/generate-report
 * @desc Generate new interview  report on  basis of user self-description, rseume pdf and job description.
 * @access Private (requires authentication)
 */


interviewRouter.post('/', authMiddleware, upload.single('resume'), interviewController.generateInterviewReportController);

/**
 * @route GET /api/interview/:interviewId
 * @desc Get interview report by interviewID
 * @access Private (requires authentication)
 */

interviewRouter.get('/report/:interviewId', authMiddleware, interviewController.getInterviewReportByIdController);


/**
 * @route GET /api/interview
 * @desc Get all interview reports of the logged in user
 * @access Private (requires authentication)
 */

interviewRouter.get('/', authMiddleware, interviewController.getAllInterviewReportsController);

/**
 * @route GET /api/interview/resume-pdf
 * @desc Generate resume PDF based on user self-description, resume pdf and job description.
 * @access Private (requires authentication)
 */

interviewRouter.post('/resume-pdf/:interviewReportId', authMiddleware, interviewController.generateResumePdfController);

export default interviewRouter;