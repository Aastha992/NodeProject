const express = require("express");
const router = express.Router();
const common = require("../utils/common.util.js");
const DailyEntry = require("../models/dailyEntry");
const Project = require("../models/Projects");
const pdfHandler = require("../utils/pdfHandler");
const moment = require("moment-timezone");
const path = require('path');
const { dailyTemplate } = require("../utils/pdfHandlerNew/htmlHandler");
const { generatePDF } = require("../utils/pdfHandlerNew/pdfDownloader");

router.post("/daily-entry", createDailyEntry);

module.exports = router;

async function createDailyEntry(req, res) {
    try {
        const {
            selectedDate,
            location,
            onShore,
            tempHigh,
            tempLow,
            weather,
            workingDay,
            reportNumber,  // Use report number from frontend
            projectId,
            contractNumber,
            contractor,
            siteInspector,
            timeIn,
            timeOut,
            ownerContact,
            ownerProjectManager,
            component,
            equipments = [], // Accept frontend format
            labours = [],
            visitors = [],
            description,
            userId,
            downloadPdf,
            format
        } = req.body;

        // If no report number is provided, generate one
        const finalReportNumber = reportNumber || await common.generateReportNumber();

        // Check for required fields
        const missingFieldsResponse = common.checkMissingFields(
            ["selectedDate", "location", "projectId", "userId"],
            req.body,
            res
        );
        if (missingFieldsResponse) return;

        // Fetch project details using projectId
        let project;
        try {
            project = await Project.findById(projectId);
            if (!project) {
                return res.status(400).json({ message: "Invalid project ID, project not found" });
            }
        } catch (error) {
            console.error("Project Fetch Error:", error.message);
            return res.status(500).json({ message: "Failed to retrieve project details" });
        }

        // Extract project details (frontend sends projectName & projectNumber, so we use those)
        const projectName = req.body.projectName || project.projectName || "N/A";
        const projectNumber = req.body.projectNumber || project.projectNumber || "N/A";
        const owner = req.body.owner || project.owner || "N/A";


        // 🚨 Check if an entry already exists for this user, project, and date
const existingEntry = await DailyEntry.findOne({
    userId,
    projectId,
    selectedDate: {
        $gte: new Date(selectedDate).setHours(0, 0, 0, 0),
        $lt: new Date(selectedDate).setHours(23, 59, 59, 999)
    }
});

if (existingEntry) {
    return res.status(400).json({
        message: "You have already submitted a daily entry for this project on this date."
    });
}


        // Directly store frontend JSON without modifying it
        const newEntry = await DailyEntry.create({
            selectedDate,
            location,
            onShore,
            tempHigh,
            tempLow,
            weather,
            workingDay,
            reportNumber: finalReportNumber,  // Save report number
            projectId,
            projectName,
            projectNumber,
            owner,
            contractNumber,
            contractor,
            siteInspector,
            timeIn,
            timeOut,
            ownerContact,
            ownerProjectManager,
            component,
            equipments,  // Save directly from frontend
            labours,  // Save directly from frontend
            visitors,  // Save directly from frontend
            description,
            userId
        });

        // Handle PDF download
        if (downloadPdf) {
            // newEntry = newEntry.toObject();
            // newEntry['project'] = project.toObject();
            // const buffer = await pdfHandler.dailyHandler(newEntry);
            // // Set headers to force download as .docx file
            // if (format === 'pdf') {
            //     res.set({
            //         'Content-Type': 'application/pdf',
            //         'Content-Disposition': 'attachment; filename=Inspection_Report.pdf',
            //     });~
            // } else {
            //     res.set({
            //         'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            //         'Content-Disposition': 'attachment; filename=Inspection_Report.docx',
            //     });
            // }

            // console.log('File sent to the frontend');
            // return res.send(buffer);  // Send the buffer directly to the client
            const date = moment.tz(selectedDate, (req.timeZone || "Asia/Kolkata"));
            const formattedDate = date.format("DD-MM-YYYY, hh:mm:ss A");
            const resp = { ...project.toObject(), ...newEntry.toObject() };
            resp.selectedDate = formattedDate;
            const dailyPdfHtml = dailyTemplate(resp);
            const pdfPath = path.join(__dirname, '../uploads/daily_report.pdf');
            const outputPath = await generatePDF(dailyPdfHtml, pdfPath);
            return common.sendPdfBuffer({res, filePath :outputPath , fileName : 'daily_entry_report.pdf'});
            // return common.success(req, res, { data: outputPath });

        }

        return common.success(req, res, {
            status: 201,
            message: "Daily entry successfully created",
            data: newEntry
        });

    } catch (error) {
        console.error("Database Insert Error:", error.message);
        return common.error(req, res, {
            status: 500,
            message: "Failed to insert data",
            details: error.message
        });
    }
}
