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

// FIX: Passed authMiddleware directly instead of authMiddleware.authUser
interviewRouter.post('/', authMiddleware, upload.single('resume'), interviewController.generateInterviewReportController);

export default interviewRouter;