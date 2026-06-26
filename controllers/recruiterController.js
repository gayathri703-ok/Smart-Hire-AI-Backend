const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { sendStatusEmail } = require('../utils/emailService');

exports.getAllApplications = async (req, res) => {
  try {
    const { status, jobId, minScore, page = 1, limit = 20 } = req.query;
    const myJobs = await Job.find({ postedBy: req.user.id }).select('_id');
    const myJobIds = myJobs.map(j => j._id);
    const query = { job: { $in: myJobIds } };
    if (status) query.status = status;
    if (jobId) query.job = jobId;
    if (minScore) query.atsScore = { $gte: parseInt(minScore) };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Application.countDocuments(query);
    const apps = await Application.find(query)
      .populate('user', 'name email skills experienceYears resumeFile')
      .populate('job', 'title company location')
      .sort({ atsScore: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    res.status(200).json({
      success: true,
      count: apps.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: apps
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    const { status, minScore } = req.query;
    const query = { job: req.params.jobId };
    if (status) query.status = status;
    if (minScore) query.atsScore = { $gte: parseInt(minScore) };
    const apps = await Application.find(query)
      .populate('user', 'name email skills experienceYears resumeFile')
      .sort({ atsScore: -1 });
    res.status(200).json({
      success: true,
      job: { id: job._id, title: job.title, company: job.company },
      count: apps.length,
      data: apps
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  console.log("🔥 UPDATE APPLICATION STATUS ROUTE HIT");
  console.log("   → params:", req.params);
  console.log("   → body:", req.body);
  console.log("   → user:", req.user?.id);

  try {
    const { status, recruiterNote } = req.body;

    // Step 1
    console.log("📌 Step 1: Validating status...");
    if (!['applied', 'in_review', 'accepted', 'rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    // Step 2
    console.log("📌 Step 2: Finding application...");
    const app = await Application.findById(req.params.id)
      .populate('job', 'postedBy title company')
      .populate('user', 'name email');

    console.log("📌 Step 2 result:", app ? "found" : "NOT FOUND");

    if (!app)
      return res.status(404).json({ success: false, message: 'Application not found' });

    // Step 3
    console.log("📌 Step 3: Auth check...");
    console.log("   → job.postedBy:", app.job?.postedBy?.toString());
    console.log("   → req.user.id:", req.user?.id);
    console.log("   → user role:", req.user?.role);

    if (app.job.postedBy.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    // Step 4
    console.log("📌 Step 4: Saving status...");
    app.status = status;
    if (recruiterNote !== undefined) app.recruiterNote = recruiterNote;
    await app.save();
    console.log("📌 Step 4: Saved ✅");

    // Step 5
    console.log("📌 Step 5: Preparing email...");
    console.log("   → to:", app.user?.email);
    console.log("   → name:", app.user?.name);
    console.log("   → job:", app.job?.title, "at", app.job?.company);

    if (!app.user?.email) {
      console.error("❌ app.user.email is undefined — skipping email");
    } else {
      try {
        console.log("📌 Step 5: Calling sendStatusEmail...");
        await sendStatusEmail(
          app.user.email,
          app.user.name,
          app.job.title,
          app.job.company,
          status,
          recruiterNote || app.recruiterNote
        );
        console.log("✅ Email sent successfully");
      } catch (emailErr) {
        console.error("❌ Email error code:", emailErr.code);
        console.error("❌ Email error message:", emailErr.message);
        console.error("❌ Full error:", emailErr);
      }
    }

    // Step 6
    console.log("📌 Step 6: Sending response...");
    res.status(200).json({
      success: true,
      message: `Status updated to '${status}'`,
      data: app
    });

  } catch (err) {
    console.error("💥 CONTROLLER CRASHED at:", err.stack || err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user.id });
    const myJobIds = myJobs.map(j => j._id);
    const [total, pending, accepted, rejected, avgArr] = await Promise.all([
      Application.countDocuments({ job: { $in: myJobIds } }),
      Application.countDocuments({ job: { $in: myJobIds }, status: 'applied' }),
      Application.countDocuments({ job: { $in: myJobIds }, status: 'accepted' }),
      Application.countDocuments({ job: { $in: myJobIds }, status: 'rejected' }),
      Application.aggregate([
        { $match: { job: { $in: myJobIds } } },
        { $group: { _id: null, avg: { $avg: '$atsScore' } } }
      ])
    ]);
    const topCandidates = await Application.find({
      job: { $in: myJobIds },
      atsScore: { $gte: 70 }
    })
      .populate('user', 'name email skills')
      .populate('job', 'title company')
      .sort({ atsScore: -1 })
      .limit(5);
    res.status(200).json({
      success: true,
      data: {
        totalJobs: myJobs.length,
        activeJobs: myJobs.filter(j => j.isActive).length,
        totalApplications: total,
        pendingApplications: pending,
        acceptedApplications: accepted,
        rejectedApplications: rejected,
        avgAtsScore: avgArr.length ? Math.round(avgArr[0].avg) : 0,
        topCandidates
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCandidateDetail = async (req, res) => {
  try {
    const candidate = await User.findById(req.params.userId).select('-password');
    if (!candidate || candidate.role !== 'candidate')
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    const myJobIds = (await Job.find({ postedBy: req.user.id }).select('_id')).map(j => j._id);
    const applications = await Application.find({
      user: req.params.userId,
      job: { $in: myJobIds }
    }).populate('job', 'title company location');
    res.status(200).json({ success: true, data: { candidate, applications } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};