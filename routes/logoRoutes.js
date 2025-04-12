const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Logo = require("../models/Logo");
const fs = require("fs");

// below is the commented code for uploading images in root directory , there is no need of this when we are uploading in s3 bucket 


/* const uploadDir = path.join(__dirname, "../uploads/logos");
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
}); */

router.post("/add-logo", async (req, res) => {
    try {
        const { companyName, fileUrl } = req.body;
        let logoUrl = path.basename(fileUrl)
        let folder_name = path.dirname(fileUrl)
        const newLogo = await Logo.create({ companyName, folder_name, logoUrl });
        if (newLogo) {
            res.status(201).json({ status: true, message: "logo is successfully added" });
        } else {
            res.status(201).json({ status: true, message: "failed to add logo" });

        }
    } catch (error) {
        res.status(500).json({ message: "Error uploading logos", error: error.message });

    }

})


// Fetch all logos for dropdown selection
router.get("/", async (req, res) => {
    try {
        const logos = await Logo.find();
        let result = []
        if (logos) {
            result = logos.map((x) => {
                const logoObj = x.toObject();
                logoObj.file_url = `${process.env.Base_Url}/${logoObj.folder_name}/${logoObj.logoUrl}`;
                return logoObj;
            });
        }
        res.status(200).json({ status: true, message: "logos list", result: result })
    } catch (error) {
        res.status(500).json({ message: "Error fetching logos", error: error.message });
    }
});

module.exports = router;
