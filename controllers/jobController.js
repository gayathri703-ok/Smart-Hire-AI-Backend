const Job = require('../models/Job');

exports.createJob = async (req, res) => {
  try {
    const { title, description, company, location, type, salaryMin, salaryMax, department, requiredSkills, experienceRequired } = req.body;
    if (!title || !description || !company)
      return res.status(400).json({ success: false, message: 'Title, description and company required' });
    const skills = Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const job = await Job.create({ title, description, company, location: location||'Remote', type: type||'full-time',
      salaryMin, salaryMax, department, requiredSkills: skills, experienceRequired: experienceRequired||0, postedBy: req.user.id });
    res.status(201).json({ success: true, data: job });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAllJobs = async (req, res) => {
  try {
    const { search, location, type, page=1, limit=10 } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [{ title:{$regex:search,$options:'i'} }, { company:{$regex:search,$options:'i'} }, { description:{$regex:search,$options:'i'} }];
    if (location) query.location = { $regex: location, $options: 'i' };
    if (type)     query.type = type;
    const skip  = (parseInt(page)-1)*parseInt(limit);
    const total = await Job.countDocuments(query);
    const jobs  = await Job.find(query).populate('postedBy','name company').sort({ createdAt:-1 }).skip(skip).limit(parseInt(limit));
    res.status(200).json({ success:true, count:jobs.length, total, pages:Math.ceil(total/parseInt(limit)), currentPage:parseInt(page), data:jobs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy','name company email');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.status(200).json({ success: true, data: job });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (req.body.requiredSkills && !Array.isArray(req.body.requiredSkills))
      req.body.requiredSkills = req.body.requiredSkills.split(',').map(s=>s.trim()).filter(Boolean);
    job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: job });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await job.deleteOne();
    res.status(200).json({ success: true, message: 'Job deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.toggleJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    job.isActive = !job.isActive;
    await job.save();
    res.status(200).json({ success: true, message: `Job is now ${job.isActive?'active':'inactive'}`, data: job });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};