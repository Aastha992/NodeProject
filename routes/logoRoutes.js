const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Logo = require("../models/Logo");
const fs = require("fs");

// Ensure `uploads/logos/` directory exists
const uploadDir = path.join(__dirname, "../uploads/logos");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); //  Create directory if it doesn't exist
}

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads/logos")); // Save in /uploads/logos
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

router.post("/upload-logo", (req, res, next) => {
    console.log("Incoming Request Body:", req.body);
    console.log("Incoming Request Headers:", req.headers);

    next();  // Pass control to the Multer middleware
}, upload.single("logo"), async (req, res) => {
    console.log(" Multer File Object:", req.file);

    if (!req.file) {
        return res.status(400).json({ message: "Please upload a valid PNG, JPG, or JPEG logo" });
    }

    const { companyName } = req.body;
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    const newLogo = await Logo.create({ companyName, logoUrl });

    res.status(201).json({ message: "Logo uploaded successfully", data: newLogo });
});


// Fetch all logos for dropdown selection
router.get("/", async (req, res) => {
    try {
        const logos = await Logo.find();
        res.json(logos);
    } catch (error) {
        res.status(500).json({ message: "Error fetching logos", error: error.message });
    }
});

module.exports = router;
