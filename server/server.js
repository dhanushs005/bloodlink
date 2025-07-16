const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Donor = require('./models/Donor');
const Emergency = require('./models/Emergency');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- API ROUTES ---

// GET all donors
app.get('/api/donors', async (req, res) => {
    try {
        const donors = await Donor.find({ reportCount: { $lt: 3 } }); // Only find donors not removed
        res.json(donors);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new donor
app.post('/api/donors', async (req, res) => {
    const donor = new Donor(req.body);
    try {
        const newDonor = await donor.save();
        res.status(201).json(newDonor);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET all emergencies
app.get('/api/emergencies', async (req, res) => {
    try {
        // Optional: you could filter old emergencies
        const emergencies = await Emergency.find().sort({ postedAt: -1 });
        res.json(emergencies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new emergency
app.post('/api/emergencies', async (req, res) => {
    const emergency = new Emergency(req.body);
    try {
        const newEmergency = await emergency.save();
        // In a real-world scenario, you would trigger a push notification service here
        res.status(201).json(newEmergency);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST a report for a donor
app.post('/api/report/:id', async (req, res) => {
    try {
        const donor = await Donor.findById(req.params.id);
        if (!donor) return res.status(404).json({ message: 'Donor not found' });

        donor.reportCount += 1;
        await donor.save();
        
        const removed = donor.reportCount >= 3;
        // The frontend will handle filtering the view, but you could also delete the record
        // if (removed) { await Donor.findByIdAndDelete(req.params.id); }

        res.json({ message: 'Report submitted.', reportCount: donor.reportCount, removed });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));