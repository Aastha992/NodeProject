const express = require('express');
const router = express.Router();
const projectAggregations = require('../aggregations/projectAggregations');
const common = require("../utils/common.util");
const Project = require("../models/Projects");
const Schedule = require("../models/Schedule");

// Get aggregated project schedules
// This api is for prefilled data for projects.
router.get('/schedules', async (req, res) => {
    try {
        // send projectId for particular project details.
        const { projectId } = req.query;
        const result = await projectAggregations.getProjectSchedules({ projectId });
        return common.success(req, res, { data: result, message: 'Success.' });
    } catch (error) {
        console.error("Error fetching aggregated data:", error);
        return common.error(req, res, { message: "Error fetching project schedules", error: error.message });
    }
});


router.delete("/remove", async (req, res) => {
    try {
        const { projectId } = req.query;

        if (!projectId) {
            return common.error(req, res, { message: "Missing projectId in request" });
        }

        // Find and delete the project
        const deletedProject = await Project.findByIdAndDelete(projectId);

        if (!deletedProject) {
            return common.error(req, res, { message: "Project not found" });
        }

        // Delete all schedules linked to the deleted project
        const deletedSchedules = await Schedule.deleteMany({ projectId: projectId });

        return common.success(req, res, {
            message: "Project and associated schedules removed successfully",
            data: {
                deletedProject,
                deletedSchedulesCount: deletedSchedules.deletedCount
            }
        });
    } catch (error) {
        console.error("Error removing project and schedules:", error);
        return common.error(req, res, {
            message: "Error removing project and associated schedules",
            error: error.message
        });
    }
});


module.exports = router;


//  Response


// {
//     "status": "success",
//     "data": [
//         {
//             "_id": "63e3f38f7984d58bf8b0f9c2",
//             "title": "Week 1 Report",
//             "contractor": "ABC Constructions",
//             "pdfUrl": "/uploads/1675767056345.pdf",
//             "month": "January",
//             "createdAt": "2025-02-07T12:30:56.346Z",
//             "projectDetails": {
//                 "projectId": "2017-5134",
//                 "projectName": "Bridge Repair Project",
//                 "clientName": "City Government",
//                 "contractNumber": "Contract-X2",
//                 "contractProjectManager": "Jane Smith"
//             }
//         }
//     ]
// }
