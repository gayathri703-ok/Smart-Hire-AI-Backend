const User = require('../models/User');
const Job  = require('../models/Job');
const { analyseMatch } = require('../utils/atsEngine');

exports.quickAnalyze = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || jobDescription.trim().length < 50)
      return res.status(400).json({ success: false, message: 'Job description must be at least 50 characters' });
    const user = await User.findById(req.user.id);
    if (!user.resumeText?.trim())
      return res.status(400).json({ success: false, message: 'Upload your resume first' });
    const result = analyseMatch(user.resumeText, jobDescription, []);
    res.status(200).json({ success: true, data: { ...result, resumeWordCount: user.resumeText.split(/\s+/).filter(Boolean).length } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.analyzeAgainstJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    const user = await User.findById(req.user.id);
    if (!user.resumeText?.trim())
      return res.status(400).json({ success: false, message: 'Upload your resume first' });
    const result = analyseMatch(user.resumeText, job.description, job.requiredSkills);
    res.status(200).json({ success: true, data: { job: { id:job._id, title:job.title, company:job.company }, ...result } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.jobBoardScores = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.resumeText?.trim())
      return res.status(400).json({ success: false, message: 'Upload your resume first' });
    const jobs = await Job.find({ isActive: true }).limit(20).sort({ createdAt: -1 });
    const results = jobs.map(job => {
      const { atsScore, matchedSkills, missingSkills } = analyseMatch(user.resumeText, job.description, job.requiredSkills);
      return { jobId:job._id, title:job.title, company:job.company, location:job.location, type:job.type,
        salaryMin:job.salaryMin, salaryMax:job.salaryMax, postedAt:job.createdAt, atsScore,
        matchedSkills, missingSkills: missingSkills.slice(0,5) };
    }).sort((a,b) => b.atsScore - a.atsScore);
    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};