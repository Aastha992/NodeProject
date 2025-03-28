const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const express = require('express');
const router = express.Router();
const authenticateJWT = require("../utils/authenticateJWT");

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
function ensureDirExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

// Define storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let directoryType = 'assets'
        let uploadDir = path.join(
            __dirname,
            `../${directoryType}/`,
        )
        ensureDirExists(uploadDir)
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});


const fileFilter = (req, file, cb) => {
    if (!file) {
        cb(new Error('File not provided!'), false); 
    }
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit to 5 MB
    },
});
router.post('/uploadAttachment',authenticateJWT, upload.fields([{ name: 'file' }]), async function (req, res) {
    try {
        if (req.files && req.files.file && Array.isArray(req.files.file) && req.files.file.length > 0) {
            const fileData = req.files.file
            let message = ``
            let uploadedData = []
            for (let row of fileData) {

                const filePath = `${row.path}`; // Change to your file path
                const fileStream = fs.createReadStream(filePath);
                const extension = path.extname(row.originalname)
                const fileName = `${path.parse(row.originalname).name}_${Date.now()}${extension}`
                const sanitizeFileName = `${req.body.type}/${fileName}`;
                const uploadParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: sanitizeFileName,
                    Body: fileStream,
                    ContentType: "image/png"
                };

                const command = new PutObjectCommand(uploadParams);
                const data = await s3.send(command);
                if (data) {
                    uploadedData.push({
                        type: req.body.type,
                        fileName: fileName,
                        fileUrl: `${process.env.Base_Url}/${sanitizeFileName}`
                    })
                    fs.unlinkSync(`${row.path}`)
                    message = `file uploaded successfully`
                } else {
                    message = `failed to upload file, something went wrong!!`
                }
            }

            res.status(200).json({
                success: true,
                message: message,
                result: uploadedData
            });

        } else {
            res.status(404).json({
                success: false,
                message: `Please provide image for uplodation`,
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
});


module.exports = router;
