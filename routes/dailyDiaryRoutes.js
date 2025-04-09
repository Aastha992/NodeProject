const express = require('express');
const router = express.Router();
const DailyDiary = require('../models/dailyDiary');
const Project = require('../models/Projects');
const common = require('../utils/common.util');
const { dailyDiaryTemplate } = require("../utils/pdfHandlerNew/htmlHandler");
const { generatePDF } = require("../utils/pdfHandlerNew/pdfDownloader");
const path = require('path');
const moment = require("moment-timezone");
const fs = require('fs');
router.get('/', async (req, res) => {
    try {
        const dailyDiaries = await DailyDiary.find();
        return res.status(200).json({
            status: "success",
            message: "Daily Diary entries retrieved successfully.",
            data: dailyDiaries
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Error retrieving Daily Diaries", error: error.message });
    }
});

router.post('/', async (req, res) => {
    const {
        projectId,
        selectedDate,
        ownerProjectManager,
        contractNumber,
        contractor,
        reportNumber,
        ownerContact,
        description,
        userId,
        downloadPdf,
        projectNumber,
        IsChargable
    } = req.body;

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(400).json({ status: "error", message: "Project not found" });
        }

        // Attempt to find an existing DailyDiary entry with the given reportNumber
        let existingDailyDiary = await DailyDiary.findOne({ reportNumber });

        if (existingDailyDiary) {
            // If an entry exists, update it
            existingDailyDiary.projectId = projectId;
            existingDailyDiary.projectNumber = project.projectNumber;
            existingDailyDiary.projectName = project.projectName;
            existingDailyDiary.selectedDate = selectedDate;
            existingDailyDiary.owner = project.owner;
            existingDailyDiary.ownerProjectManager = ownerProjectManager;
            existingDailyDiary.contractNumber = contractNumber;
            existingDailyDiary.contractor = contractor;
            existingDailyDiary.ownerContact = ownerContact;
            existingDailyDiary.description = description;
            existingDailyDiary.userId = userId;
            existingDailyDiary.IsChargable = IsChargable;
            //ADD REPORT NUMBER
            existingDailyDiary.reportNumber = reportNumber

            try {
                await existingDailyDiary.save(); // Save the updated entry

                return res.status(200).json({ // Changed status code to 200 for update
                    status: "success",
                    message: "Daily Diary entry updated successfully.",
                    data: existingDailyDiary
                });
            } catch (updateError) {
                // Check for duplicate key error during update
                if (updateError.code === 11000) {
                    return res.status(400).json({
                        status: "error",
                        message: "Error updating Daily Diary: Duplicate key violation.  Another entry exists with the same unique value.", // more descriptive message
                        error: updateError.message
                    });
                }
                // Re-throw other errors
                throw updateError;

            }
        } else {
            // If an entry doesn't exist, create a new one
            const newDailyDiary = await DailyDiary.create({
                projectId,
                projectNumber: project.projectNumber || projectNumber,
                projectName: project.projectName,
                selectedDate,
                owner: project.owner,
                ownerProjectManager,
                contractNumber,
                contractor,
                ownerContact,
                reportNumber,
                description,
                IsChargable,
                userId
            });
            if (downloadPdf) {
                const date = moment.tz(selectedDate, (req.timeZone || "Asia/Kolkata"));
                const formattedDate = date.format("DD-MM-YYYY, hh:mm:ss A");
                const resp = { ...project.toObject(), ...newDailyDiary.toObject() };
                resp.selectedDate = formattedDate;
                const dailyDiaryPdfHtml = dailyDiaryTemplate(resp);
                const pdfPath = path.join(__dirname, '../uploads/daily_diary_report.pdf');
                const outputPath = await generatePDF(dailyDiaryPdfHtml, pdfPath);
                // Set headers for PDF download
                return common.sendPdfBuffer({res, filePath :outputPath , fileName : 'daily_diary_report.pdf'});
                // return common.success(req, res, { data: outputPath });
            }
            return res.status(201).json({
                status: "success",
                message: "Daily Diary entry created successfully.",
                data: newDailyDiary
            });
        }

    } catch (error) {
        return res.status(500).json({ status: "error", message: "Error creating/updating Daily Diary", error: error.message });
    }
});

module.exports = router;
