const express = require("express");
const router = express.Router();
const PhotoFiles = require("../models/PhotoFiles");
const authenticateJWT = require("../utils/authenticateJWT"); // Import JWT middleware
const multer = require("multer");
const { body, validationResult } = require('express-validator');
const common = require("../utils/common.util");
const fs = require("fs");
const moment = require('moment')
const path = require("path");
const {deleteAttachmentFromS3} = require("../config/genricFn/s3Fn")

const upload = multer({ storage: common.prepareStorage });

// Route to upload photo metadata
router.post(
  "/upload-photo",
  // authenticateJWT,
  upload.single('photo'),
  async (req, res) => {
    // Validate request body
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "failed", message: "Image is Required" });
    }

    try {
      const imagePath = req.file.path;
      const { location = "Default", time = "2025-10-01 10:22:33" } = req.body;
      let photo = path.join(__dirname, `../${imagePath}`);

      // Read the existing image file as a buffer
      const imageBuffer = fs.readFileSync(photo);

      // Process the image with `common.imageHandler`
      const newImageBuffer = await common.imageHandler({ imageUrl: imageBuffer, locationText: location, timestampText: time });

      // Overwrite the existing file with the new buffer
      fs.writeFileSync(photo, newImageBuffer);
      return common.success(req, res, { data: `http://0.0.0.0:5001/${imagePath}`, status: 201 });
    } catch (error) {
      return common.error(req, res, { message: "Failed to upload Image", status: 500, details: error });
    }
  }
);

// Route to upload photo metadata along with image details
router.post(
  "/photo-files",
  authenticateJWT,
  [
    body("userId").notEmpty().withMessage("User ID is Required"),
    // body("projectId").notEmpty().withMessage("Project ID is Required"),
    body("imageurl").notEmpty().withMessage("imageurl is Required"),
    body("location").notEmpty().withMessage("Location is Required"),
    body("date").notEmpty().withMessage("Date is Required"),
    body("time").notEmpty().withMessage("Time is Required")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation failed:", errors.array()); // Log validation errors
      return common.validationError(req, res, { message: "Validation failed", validationObj: errors.array() })
    }

    const { userId, projectId, imageurl, location, date, time, description = "" } = req.body;
    try {
      try {
        await common.validateReferences({ projectId, userId });
      } catch (error) {
        return common.validationError(req, res, { message: error.message });
      }
      let photo = path.basename(imageurl)
      let folder_name = path.dirname(imageurl)
      const newPhoto = await PhotoFiles.create({ userId, photo, location, date, folder_name, time, description, projectId });
      let uploadedUrl = ''
      if (newPhoto) {
        uploadedUrl = `${process.env.Base_Url}/${newPhoto.folder_name}/${newPhoto.photo}`
      }
      return common.success(req, res, { data: uploadedUrl, status: 201 });
    } catch (error) {
      return common.error(req, res, { message: "Failed to save photo", status: 500, details: error });
    }
  }
);


// Route to fetch all photos for a specific user
router.get("/photo-files/:userId", authenticateJWT, async (req, res) => {
  const { userId } = req.params;

  try {
    // Find all photos for the specified user
    const photos = await PhotoFiles.find({ userId });
    let result = []
    if (photos && photos.length > 0) {

      result = photos.map((x) => {
        const photoObj = x.toObject();
        photoObj.file_url = `${process.env.Base_Url}/${photoObj.folder_name}/${photoObj.photo}`;
        photoObj.createdAt = moment(photoObj.createdAt).format('DD-MMM-YYYY hh:mm:ss')
        photoObj.updatedAt = moment(photoObj.updatedAt).format('DD-MMM-YYYY hh:mm:ss')
        return photoObj;
      });

    }
    return common.success(req, res, { data: result, status: 200, message: "Photos fetched successfully" });
  } catch (error) {
    return common.error(req, res, { message: "Failed to fetch photos", status: 500, details: error.message });
  }
});

// Route to delete a specific photo by ID
router.delete("/photo-files/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    let result = await deletePhotos(id)
    res.status(200).json({
      status: result.status,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete photo",
      error: error.message,
    });
  }
});
const deletePhotos = async (photoId) => {
  try {

    const photoRecord = await PhotoFiles.findById(photoId);

    if (!photoRecord) {
      return { status: false, message: "Image doesn't exist" };
    }

    const dbDeleteResult = await PhotoFiles.findByIdAndDelete(photoId);
    if (!dbDeleteResult) {
      return { status: false, message: "Failed to delete image from database" };
    }

    let fileUrl = `${photoRecord.folder_name}/${photoRecord.photo}`

    const s3DeleteResult = await deleteAttachmentFromS3(fileUrl);
    if (!s3DeleteResult?.status) {
      return { status: false, message: "Image deleted from DB, but failed to delete from S3" };
    }

    return {
      status: true,
      message: "Image successfully deleted from database and S3 bucket"
    };

  } catch (error) {
    console.error("Error deleting image:", error);
    return {
      status: false,
      message: `Server error: ${error.message}`
    };
  }
};



// new route for photo upload

// POST route for handling image uploads
// router.post('/upload', upload.single('file'), async (req, res) => {
//   try {
//     let filePath;
//     let fileName;

//     if (req.file) {
//       // Case 1: File upload using multer
//       filePath = req.file.path;
//       fileName = req.file.originalname;
//     } else if (req.body.base64Image) {
//       // Case 2: Base64-encoded image upload
//       const base64Data = req.body.base64Image.replace(/^data:image\/\w+;base64,/, '');
//       fileName = `image_${Date.now()}.png`;  // Default to PNG, but you can detect MIME type if needed
//       filePath = path.join(__dirname, 'temp', fileName);

//       // Decode and save the base64 image to the temporary file
//       fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
//     } else {
//       throw new Error('No file or base64 image provided.');
//     }

//     // Upload the image to Appwrite
//     await common.uploadImageToAppwrite(filePath, fileName);

//     return common.success(req, res, { data: fileUrl });
//   } catch (error) {
//     return common.error(req, res, { message: error.message });
//   }
// });

module.exports = router;
