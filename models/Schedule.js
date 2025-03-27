const mongoose = require('mongoose');



const ScheduleSchema = new mongoose.Schema({
    // title: { type: String, required: true },
    // contractor: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    month: { type: String },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },  //Linked to Project
    projectNumber: { type: String, required: true },
    projectName: { type: String, required: true },
    owner: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Schedule = mongoose.model('Schedule', ScheduleSchema);

module.exports = Schedule;
