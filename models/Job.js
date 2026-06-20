const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title:              { type: String, required: true, trim: true },
  description:        { type: String, required: true },
  company:            { type: String, required: true, trim: true },
  location:           { type: String, default: 'Remote' },
  type:               { type: String, enum: ['full-time','part-time','contract','internship'], default: 'full-time' },
  salaryMin:          { type: Number },
  salaryMax:          { type: Number },
  department:         { type: String },
  requiredSkills:     [{ type: String }],
  experienceRequired: { type: Number, default: 0 },
  isActive:           { type: Boolean, default: true },
  postedBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicantCount:     { type: Number, default: 0 }
}, { timestamps: true });

JobSchema.index({ title: 'text', description: 'text', company: 'text' });

module.exports = mongoose.model('Job', JobSchema);