const { v4: uuidv4 } = require('uuid');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Project = require('../models/Projects');
const UserDetails = require('../models/UserDetails');
const axios = require('axios');
const imageHandler = require("./imageHandler");
const WeeklyModel = require("../models/weeklyEntry");
const ensureUploadsFolderExists = () => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log("Uploads folder created at:", uploadPath);
    }
};

// Multer storage setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadsFolderExists();  // Ensure folder exists before storing files
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});


const validateReferences = async ({ projectId, userId, weeklyReportId }) => {
    let project, user, weeklyData;
    if (projectId) {
        project = await Project.findById(projectId);
        if (!project) {
            throw new Error("Project not found");
        }

    }

    if (userId) {
        user = await UserDetails.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
    }
    if (weeklyReportId) {
        weeklyData = await WeeklyModel.findById(weeklyReportId);
        if (!weeklyData) {
            throw new Error("Weekly Report not found");
        }
    }
    return { project, user, weeklyData }
};


module.exports = {
    success: (_, res, successObject) => {
        return res.status(successObject?.status || 200).json({
            status: "success",
            message: successObject?.message || "Request was successful",
            data: successObject?.data || null
        });
    },

    error: (_, res, errorObject) => {
        return res.status(errorObject?.status || 401).json({
            status: "error",
            message: errorObject?.message || "Unauthorized",
            error: errorObject?.details || null
        });
    },

    validationError: (_, res, validationObj) => {
        return res.status(400).json({
            status: "error",
            message: validationObj?.message || "Validation error",
            errors: validationObj?.errors || validationObj || "Invalid input data"
        });
    },

    fieldsMissing: (_, res, errorObject) => {
        return res.status(400).json({
            status: "error",
            message: "Missing required fields",
            errors: errorObject || "Fields are missing"
        });
    },
    checkMissingFields: (requiredFields, reqBody, res) => {
        const missingFields = requiredFields.filter(field => !reqBody[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Missing required fields",
                errors: {
                    missingFields: missingFields
                }
            });
        }
        return null;
    },
    generateReportNumber: async (req, res) => {
        const year = new Date().getFullYear();  // Get current year (e.g., 2025)
        const random1 = Math.floor(1000 + Math.random() * 9000);  // Random 4-digit number (1000-9999)
        const random2 = uuidv4().slice(0, 4);  // First 4 characters of UUID for uniqueness
        const reportId = `${year}-${random1}-${random2}`;
        return reportId;
    },
    prepareStorage: storage,
    validateReferences,
    fetchRemoteImage: async (url) => {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return response.data;  // Returns image data as a buffer
    },
    imageHandler,
    sendPdfBuffer: ({ res, filePath, fileName = "Daily_Report.pdf" }) => {
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${fileName}`,
        });

        // Create a readable stream
        const fileStream = fs.createReadStream(filePath);

        // Pipe the file to the response
        fileStream.pipe(res);

        // Delete the file after sending
        fileStream.on('end', () => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting the file:', err);
                } else {
                    console.log('Temporary PDF file deleted:', filePath);
                }
            });
        });

        // Handle errors during streaming
        fileStream.on('error', (err) => {
            console.error('Error streaming the file:', err);
            res.status(500).send({ status: 'failed', message: 'Error sending the PDF file.' });
        });
    }
};
