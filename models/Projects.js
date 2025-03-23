const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectName: { type: String, required: true },
    projectNumber: { type: String, required: true },
    owner: { type: String, required: true },
    startDate: { 
        type: Date, 
        required: true,
        validate: {
            validator: function(value) {
                return !this.endDate || value < this.endDate;
            },
            message: "Start date must be before the end date"
        }
    },
    endDate: { type: Date }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
