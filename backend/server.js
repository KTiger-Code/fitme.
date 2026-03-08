const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/exercises', require('./routes/exercise.routes'));
app.use('/api/plans', require('./routes/plan.routes'));
app.use('/api/workouts', require('./routes/workout.routes'));
app.use('/api/weight', require('./routes/weight.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`FitLife Tracker server running on http://localhost:${PORT}`);
});
