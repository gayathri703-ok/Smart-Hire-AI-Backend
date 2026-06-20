const express   = require('express');
const cors      = require('cors');
const dotenv    = require('dotenv');
const path      = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5173'],
  credentials: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/resume',       require('./routes/resumeRoutes'));
app.use('/api/jobs',         require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/analyzer',     require('./routes/analyzerRoutes'));
app.use('/api/recruiter',    require('./routes/recruiterRoutes'));
app.use('/api/recruiter',    require('./routes/recruiterRoutes'));
app.use('/api/ai-feedback',  require('./routes/aiFeedbackRoutes'));

app.get('/', (req, res) => res.json({ success: true, message: 'SmartHire AI API running ✅' }));

app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` }));
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 SmartHire API → http://localhost:${PORT}`);
  console.log(`🗄️  MongoDB      → ${process.env.MONGO_URI}`);
  console.log(`🌍 Mode         → ${process.env.NODE_ENV}\n`);
});