const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String, required: true, minlength: 6, select: false },
  role:             { type: String, enum: ['candidate','recruiter','admin'], default: 'candidate' },
  resumeText:       { type: String, default: '' },
  resumeFile:       { type: String, default: null },
  resumeUploadedAt: { type: Date,   default: null },
  skills:           [{ type: String }],
  experienceYears:  { type: Number, default: 0 },
  company:          { type: String, default: '' }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.matchPassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);