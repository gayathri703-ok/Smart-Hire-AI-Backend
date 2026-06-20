const User = require('../models/User');
const { extractTextFromPDF, deleteFile } = require('../utils/pdfExtractor');
const { extractSkills, extractExperienceYears } = require('../utils/atsEngine');
const path = require('path');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    let resumeText = '';
    try { resumeText = await extractTextFromPDF(filePath); } catch (e) { console.warn('PDF parse warn:', e.message); }
    const existing = await User.findById(req.user.id);
    if (existing.resumeFile) deleteFile(existing.resumeFile);
    const detectedSkills = extractSkills(resumeText);
    const detectedYears  = extractExperienceYears(resumeText);
    const user = await User.findByIdAndUpdate(req.user.id, {
      resumeFile: req.file.filename, resumeText, resumeUploadedAt: new Date(),
      skills: detectedSkills, experienceYears: detectedYears
    }, { new: true });
    res.status(200).json({ success: true, message: 'Resume uploaded and parsed', data: {
      filename: user.resumeFile, wordCount: resumeText.split(/\s+/).filter(Boolean).length,
      detectedSkills, detectedYears
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.resumeFile) return res.status(404).json({ success: false, message: 'No resume uploaded yet' });
    res.status(200).json({ success: true, data: {
      filename: user.resumeFile, uploadedAt: user.resumeUploadedAt,
      skills: user.skills, experienceYears: user.experienceYears,
      wordCount: user.resumeText.split(/\s+/).filter(Boolean).length, resumeText: user.resumeText
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.resumeFile) return res.status(404).json({ success: false, message: 'No resume to delete' });
    deleteFile(user.resumeFile);
    await User.findByIdAndUpdate(req.user.id, { resumeFile: null, resumeText: '', resumeUploadedAt: null, skills: [] });
    res.status(200).json({ success: true, message: 'Resume deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};