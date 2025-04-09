const mongoose = require('mongoose');

const DailyDiarySchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    projectNumber: { type: String, required: true },  // Now storing project number directly
    projectName: { type: String, required: true },  // Now storing project name directly
    selectedDate: { type: Date, required: true },
    owner: { type: String, required: true },  // Owner of the project
    ownerProjectManager: { type: String, required: true },  // Project Manager from owner side
    reportNumber: { type: String, required: true, unique: true },  // Unique report number
    contractNumber: { type: String, required: true },  // Contract number
    contractor: { type: String, required: true },  // Contractor name
    ownerContact: { type: String, required: true },  // Owner contact info
    description: { type: String, required: true },  // Project description
    IsChargable: {type: String, required: true},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserDetails', required: true }
}, { timestamps: true });

const DailyDiary = mongoose.model('DailyDiary', DailyDiarySchema);

module.exports = DailyDiary;
