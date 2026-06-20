const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job:               { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  required: true },
  atsScore:          { type: Number, default: 0 },
  skillMatchScore:   { type: Number, default: 0 },
  keywordMatchScore: { type: Number, default: 0 },
  experienceScore:   { type: Number, default: 0 },
  matchedSkills:     [{ type: String }],
  missingSkills:     [{ type: String }],
  suggestions:       [{ type: String }],
  status:            { type: String, enum: ['applied','in_review','accepted','rejected'], default: 'applied' },
  recruiterNote:     { type: String, default: '' },
  resumeSnapshot:    { type: String, default: '' }
}, { timestamps: true });

ApplicationSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);