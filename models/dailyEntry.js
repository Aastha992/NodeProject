const mongoose = require('mongoose');

// Labour Schema
const LabourSchema = new mongoose.Schema({
    roleName: { type: String, required: true },   // Renamed 'role' to 'roleName' to match frontend
    hours: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    totalHours: { type: Number }
});

// Contractor Schema (Labour Details)
const ContractorSchema = new mongoose.Schema({
    contractorName: { type: String, required: true },
    roles: [LabourSchema]   // Renamed `labours` to `roles` for consistency
});

// Equipment Schema
const EquipmentSchema = new mongoose.Schema({
    equipmentName: { type: String, required: true },   // Renamed `equipmentName` to `name`
    quantity: { type: Number, default: 1 },
    hours: { type: Number, required: true },
    totalHours: { type: Number }
});

// Visitor Schema
const VisitorSchema = new mongoose.Schema({
    visitorName: { type: String, required: true },
    company: { type: String },   // Renamed `visitorCompany` to `company`
    quantity: { type: Number, default: 1 },   // Added missing quantity field
    hours: { type: Number, default: 0 },
    totalHours: { type: Number }
});

// Main Daily Entry Schema
const DailyEntrySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserDetails', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    
    //  Added Missing Fields
    projectName: { type: String, required: true },   // Now it stores project name
    projectNumber: { type: String, required: true }, // Now it stores project number
    ownerProjectManager: { type: String },  //  Renamed from `cityProjectManager`
    ownerContact: { type: String }, //  Fixed casing issue

    selectedDate: { type: Date, required: true },
    location: { type: String, required: true },
    onShore: { type: String },
    tempHigh: { type: String },
    tempLow: { type: String },
    weather: { type: String },
    workingDay: { type: String },
    reportNumber: { type: String, required: true },   // Fixed mismatch (`reportNo` → `reportNumber`)
    
    contractNumber: { type: String },
    contractor: { type: String },   // Added missing contractor field
    siteInspector: { type: String },
    timeIn: { type: String },
    timeOut: { type: String },
    component: { type: String },

    equipments: [EquipmentSchema],  // Equipment Details
    labours: [ContractorSchema],    // labour Details (Renamed from contractorDetails)
    visitors: [VisitorSchema],      // Visitor Details
    
    description: { type: String }
}, {
    collection: "DailyEntry",
    timestamps: true
});

module.exports = mongoose.model('DailyEntry', DailyEntrySchema);
