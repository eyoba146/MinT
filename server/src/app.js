const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const startupRoutes = require('./routes/startupRoutes');
const accessRequestRoutes = require('./routes/accessRequestRoutes');
const documentRoutes = require('./routes/documentRoutes');
const userRoutes = require('./routes/userRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const auditRoutes = require('./routes/auditRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const ecosystemBuilderRoutes = require('./routes/ecosystemBuilderRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/access-requests', accessRequestRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/ecosystem-builders', ecosystemBuilderRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Digital Innovation Hub API is running' });
});

app.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large (max 10MB)' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

module.exports = app;