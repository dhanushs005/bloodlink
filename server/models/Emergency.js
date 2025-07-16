const mongoose = require('mongoose');

const EmergencySchema = new mongoose.Schema({
    pname: { type: String, required: true },
    contact: { type: String, required: true },
    hospital: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    blood_type: { type: String, required: true },
    units: { type: Number, required: true },
    postedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Emergency', EmergencySchema);