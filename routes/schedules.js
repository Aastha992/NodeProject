const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Schedule = require("../models/Schedule");
const Project = require("../models/Projects"); // Import Project model
const fs = require("fs");
const common = require("../utils/common.util");

// Multer setup for file uploads
const upload = multer({
    storage: common.prepareStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
            return cb(new Error("Only PDF files are allowed"), false);
        }
        cb(null, true);
    },
});

// **Upload a New Schedule**
router.post("/upload", upload.single("schedule"), async (req, res) => {
    try {
        console.log("Received form data:", req.body); // Debugging log

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const {
            // title,
            // contractor,
            month,
            projectNumber,
            projectName,
            owner,
            scheduleId // In case of updating an existing schedule
        } = req.body;

        // **Check if `projectNo` exists in the Projects collection**
        let project = await Project.findOne({ projectNumber });

        // **If project does not exist, create a new one**
        if (!project) {
            project = new Project({
                projectNumber,
                projectName,
                owner,
                startDate: new Date(), // Optional: set default start date
                endDate: null // End date is optional
            });

            await project.save();
        }

        // **If updating an existing schedule**
        if (scheduleId) {
            const updatedSchedule = await Schedule.findByIdAndUpdate(
                scheduleId,
                {
                    // title,
                    // contractor,
                    month,
                    projectId: project._id, // Link to existing or new project
                    projectNumber,
                    projectName,
                    owner,
                    pdfUrl: req.file ? `/uploads/${req.file.filename}` : undefined
                },
                { new: true, omitUndefined: true } // Return updated schedule
            );

            return res.status(200).json({
                message: "Success",
                data: {
                    _id: newSchedule._id,
                    // title: newSchedule.title,
                    // contractor: newSchedule.contractor,
                    month: newSchedule.month,
                    projectId: newSchedule.projectId,  // Ensure projectId is included
                    projectNumber: newSchedule.projectNumber,
                    projectName: newSchedule.projectName,
                    owner: newSchedule.owner,
                    pdfUrl: newSchedule.pdfUrl,
                    createdAt: newSchedule.createdAt
                }
            });
            
        }

        // **If creating a new schedule**
        const newSchedule = new Schedule({
            // title,
            // contractor,
            month,
            projectId: project._id, // Link to existing or new project
            projectNumber,
            projectName,
            owner,
            pdfUrl: `/uploads/${req.file.filename}`
        });

        await newSchedule.save();

        return res.status(200).json({
            message: "Success",
            data: newSchedule
        });

    } catch (error) {
        console.error("Error uploading schedule:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// **Get All Schedules (with project details)**
router.get("/", async (req, res) => {
    try {
        const schedules = await Schedule.find().populate("projectId", "projectName projectNumber owner");
        res.json(schedules);
    } catch (error) {
        console.error("Error fetching schedules:", error);
        res.status(500).json({ message: "Error fetching schedules" });
    }
});

module.exports = router;
