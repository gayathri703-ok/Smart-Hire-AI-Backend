const User = require('../models/User');
const { generateAIFeedback } = require('../Utils/aiFeedbackService');
const { analyseMatch } = require('../utils/atsEngine');

// @desc    Get AI-powered resume feedback for a job description
// @route   POST /api/ai-feedback/analyze
// @access  Private (candidate)
exports.getAIFeedback = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a job description with at least 50 characters'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user.resumeText || user.resumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your resume first'
      });
    }

    // Get the rule-based ATS score for context
    const basicAnalysis = analyseMatch(user.resumeText, jobDescription, []);

    // Get AI-powered feedback
    const aiResult = await generateAIFeedback(user.resumeText, jobDescription, basicAnalysis.atsScore);

    if (!aiResult.success) {
      return res.status(502).json({ success: false, message: aiResult.message });
    }

    res.status(200).json({
      success: true,
      data: {
        atsScore: basicAnalysis.atsScore,
        ...aiResult.data
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};