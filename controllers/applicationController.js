const Application = require('../models/Application');
const Job  = require('../models/Job');
const User = require('../models/User');
const { analyseMatch } = require('../utils/atsEngine');
const { sendStatusEmail } = require('../utils/emailService');

exports.applyForJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job)         return res.status(404).json({ success: false, message: 'Job not found' });
    if (!job.isActive) return res.status(400).json({ success: false, message: 'Job not accepting applications' });
    const user = await User.findById(req.user.id);
    if (!user.resumeText?.trim()) return res.status(400).json({ success: false, message: 'Upload your resume first' });
    if (await Application.findOne({ user: req.user.id, job: req.params.jobId }))
      return res.status(400).json({ success: false, message: 'Already applied to this job' });
    const analysis = analyseMatch(user.resumeText, job.description, job.requiredSkills);
    const application = await Application.create({
      user: req.user.id, job: req.params.jobId,
      atsScore: analysis.atsScore, skillMatchScore: analysis.skillMatchScore,
      keywordMatchScore: analysis.keywordMatchScore, experienceScore: analysis.experienceScore,
      matchedSkills: analysis.matchedSkills, missingSkills: analysis.missingSkills,
      suggestions: analysis.suggestions, resumeSnapshot: user.resumeText
    });
    await Job.findByIdAndUpdate(req.params.jobId, { $inc: { applicantCount: 1 } });
    res.status(201).json({ success: true, message: 'Application submitted!', data: {
      applicationId: application._id, atsScore: analysis.atsScore,
      matchedSkills: analysis.matchedSkills, missingSkills: analysis.missingSkills, suggestions: analysis.suggestions
    }});
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Already applied to this job' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ user: req.user.id })
      .populate('job','title company location type salaryMin salaryMax isActive')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: apps.length, data: apps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getApplication = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('job','title company location description requiredSkills')
      .populate('user','name email skills experienceYears');
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    if (req.user.role === 'candidate' && app.user._id.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });
    res.status(200).json({ success: true, data: app });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.withdrawApplication = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    if (app.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    await app.deleteOne();
    await Job.findByIdAndUpdate(app.job, { $inc: { applicantCount: -1 } });
    res.status(200).json({ success: true, message: 'Application withdrawn' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};