const express = require("express");
const router = express.Router();

// POST /api/jha/job-hazard: Handle form submission
router.post("/job-hazard", async (req, res) => {
    const {
        selectedDate,
        time,
        location,
        projectName,
        description,
        checkedItems,
        tasks,
        workers,
        reviewedBy,
        reviewSignature,
        dateReviewed,
    } = req.body;

    try {
        // Validate required fields
        if (
            !selectedDate ||
            !time ||
            !location ||
            !projectName ||
            !description ||
            !workers ||
            !workers.length ||
            !reviewedBy ||
            !reviewSignature ||
            !dateReviewed
        ) {
            return res.status(400).json({
                status: "Failed",
                message: "All required fields must be provided.",
                missingFields: {
                    selectedDate: !selectedDate,
                    time: !time,
                    location: !location,
                    projectName: !projectName,
                    description: !description,
                    workers: !(workers && workers.length),
                    reviewedBy: !reviewedBy,
                    reviewSignature: !reviewSignature,
                    dateReviewed: !dateReviewed,
                },
            });
        }

        // Respond with the submitted data
        res.status(200).json({
            status: "successful",
            message: "Job Hazard data submitted successfully.",
            data: {
                selectedDate,
                time,
                location,
                projectName,
                description,
                checkedItems: checkedItems || [],
                tasks: tasks || [],
                workers,
                reviewedBy,
                reviewSignature,
                dateReviewed,
            },
        });
    } catch (error) {
        console.error("Error processing Job Hazard submission:", error);
        res.status(500).json({
            status: "Failed",
            message: "Error processing Job Hazard submission.",
            error: error.message,
        });
    }
});

module.exports = router;
