const mongoose = require("mongoose");

const WeeklyEntrySchema = new mongoose.Schema(
    {
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
        weekStartDate: { type: Date, required: true },
        weekEndDate: { type: Date, required: true },
        owner: { type: String },
        contractNumber: { type: String },
        projectManager: { type: String },
        consultantProjectManager: { type: String },
        contractProjectManager: { type: String },
        contractorSiteSupervisorOnshore: { type: String },
        contractorSiteSupervisorOffshore: { type: String },
        siteInspector: { type: String },
        cityProjectManager: { type: String },
        inspectorTimeIn: { type: String },
        inspectorTimeOut: { type: String },
        projectNumber: { type: String },
        projectName: { type: String },
        // References to Daily Entries and Daily Diaries
        dailyEntries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DailyEntry' }],
        dailyDiaries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DailyDiary' }],
        
        // Optional field for storing uploaded images
        images: [{ type: String }],
		dayDetails: { type: Map, of: String },
        userId :  { type: mongoose.Schema.Types.ObjectId, ref: 'UserDetails', required: true },
        contractAdministrator: { type: String, default: "Not Assigned" },
        supportCA: { type: String, default: "Not Assigned" }
       
    },
    { collection: "WeeklyEntry", timestamps: true }
);

module.exports = mongoose.model("WeeklyEntry", WeeklyEntrySchema);
