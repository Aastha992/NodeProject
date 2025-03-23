const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');

const getProjectSchedules = async ({ projectId = null }) => {
    const pipeline = [];

    // If projectId is provided, convert it to ObjectId and add the $match stage
    if (projectId) {
        pipeline.push({ $match: { projectId: new mongoose.Types.ObjectId(projectId) } });
    }

    pipeline.push(
        {
            $lookup: {
                from: 'projects',              // Join with projects collection
                localField: 'projectId',       // Foreign key in schedules
                foreignField: '_id',           // Primary key in projects
                as: 'projectDetails'           // Store joined data here
            }
        },
        { $unwind: "$projectDetails" },        // Flatten project details
        {
            $project: {
                scheduleId: "$_id",            // Rename _id to scheduleId
                title: 1,
                contractor: 1,
                pdfUrl: 1,
                month: 1,
                createdAt: 1,
                projectId: "$projectDetails._id",  // Rename project _id to projectId in response
                "projectDetails.projectName": 1,
                "projectDetails.clientName": 1,
                "projectDetails.contractNumber": 1,
                "projectDetails.contractProjectManager": 1
            }
        }
    );

    return await Schedule.aggregate(pipeline);
};

module.exports = {
    getProjectSchedules
};
