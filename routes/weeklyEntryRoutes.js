const express = require("express");
const router = express.Router();
const WeeklyEntry = require("../models/weeklyEntry");
const DailyEntry = require("../models/dailyEntry");
const DailyDiary = require("../models/dailyDiary");
const common = require("../utils/common.util");
const authenticateJWT = require("../utils/authenticateJWT");
const mongoose = require("mongoose");



router.post("/weekly-entry",authenticateJWT, async (req, res) => {
    const {
        projectId,
        startDate,
        endDate,
        consultantProjectManager,
        contractProjectManager,
        contractorSiteSupervisorOnshore,
        contractorSiteSupervisorOffshore,
        contractAdministrator,
        supportCA,
        siteInspector,
        inspectorTimeIn,
        inspectorTimeOut,
        dayDetails,
        images,
        owner,
        userId,
        client,
        cityProjectManager,
        contractNumber,
        projectNumber,
        projectName
    } = req.body;


    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();


    // Validation for missing fields
    const missingFieldsResponse = common.checkMissingFields(
        ["projectId", "startDate", "endDate", "userId"],
        req.body,
        res
    );
    if (missingFieldsResponse) return;

    try {

        let project;
        try {
            ({ project } = await common.validateReferences({ projectId, userId }));
        } catch (error) {
            return common.validationError(req, res, { message: error.message });
        }
        // Find daily entries and daily diaries within the date range
        const [dailyEntries, dailyDiaries] = await Promise.all([
            DailyEntry.find({
                projectId,
                selectedDate: { $gte: start, $lte: end }
            }),
            DailyDiary.find({
                projectId,
                selectedDate: { $gte: start, $lte: end }
            })
        ]);

        let finalProjectName = projectName;
        let finalProjectNumber = projectNumber;

        if (!finalProjectName || !finalProjectNumber) {
            const firstDailyEntry = dailyEntries.length > 0 ? dailyEntries[0] : null;
            if (firstDailyEntry) {
                finalProjectName = finalProjectName || firstDailyEntry.projectName;
                finalProjectNumber = finalProjectNumber || firstDailyEntry.projectNumber;
            }
        }
        let newWeeklyEntry = await WeeklyEntry.create({
            projectId,
            weekStartDate: start,
            weekEndDate: end,
            client,
            contractNumber,
            cityProjectManager,
            contractProjectManager,
            consultantProjectManager,
            contractorSiteSupervisorOnshore,
            contractorSiteSupervisorOffshore,
            contractAdministrator,
            supportCA,
            projectName: finalProjectName,
            owner,
            siteInspector,
            inspectorTimeIn,
            inspectorTimeOut,
            dailyEntries: dailyEntries.map(entry => entry._id),
            dailyDiaries: dailyDiaries.map(diary => diary._id),
            dayDetails,
            images,
            userId,
            projectNumber: finalProjectNumber
        });

        // Convert to object and return response
        newWeeklyEntry = newWeeklyEntry.toObject();
        newWeeklyEntry['weeklyReportId'] = newWeeklyEntry._id;
        delete newWeeklyEntry._id;

        return common.success(req, res, {
            message: "Weekly entry created successfully.",
            data: {
                newWeeklyEntry,
                project: project.toObject(),
                linkedDailyEntries: dailyEntries,
                linkedDailyDiaries: dailyDiaries
            }
        });

    } catch (error) {
        return common.error(req, res, {
            message: "Error creating weekly entry.",
            error: error
        });
    }
});
router.post("/getWeeklyReport", authenticateJWT, async (req, res) => {
    try {
        const missingFields = [];

        if (!req.body.projectId) missingFields.push("projectId");
        if (!req.body.filter?.startDate) missingFields.push("filter.startDate");
        if (!req.body.filter?.endDate) missingFields.push("filter.endDate");
        
        if (missingFields.length > 0) {
            res.status(400).json({
                message: `Please provide required fields: ${missingFields.join(", ")}`
            });
            return;
        }
        let query = { projectId: req.body.projectId };
         

        // Add date filter if startDate and endDate are provided
        if (req.body.filter.startDate && req.body.filter.endDate) {
            query.weekStartDate = {
                $gte: new Date(req.body.filter.startDate),
                $lte: new Date(req.body.filter.endDate)
            };
        }


        let weeklyList = await WeeklyEntry.find(query)
            .populate({
                path: 'dailyDiaries',
                model: 'DailyDiary'
            })
            .populate({
                path: 'dailyEntries',
                model: 'DailyEntry'
            })
            .populate({
                path: 'userId',
                model: 'UserDetails',
                select: 'username email '
            })
        const formattedList = weeklyList.map(entry => {
            const doc = entry._doc;

            return {
                _id: doc.userId?._id || null,
                username: doc.userId?.username || '',
                email: doc.userId?.email || '',
                weeklyReport: {
                    _id: doc._id,
                    projectId: doc.projectId,
                    weekStartDate: doc.weekStartDate,
                    weekEndDate: doc.weekEndDate,
                    consultantProjectManager: doc.consultantProjectManager,
                    contractProjectManager: doc.contractProjectManager,
                    contractorSiteSupervisorOnshore: doc.contractorSiteSupervisorOnshore,
                    contractorSiteSupervisorOffshore: doc.contractorSiteSupervisorOffshore,
                    siteInspector: doc.siteInspector,
                    inspectorTimeIn: doc.inspectorTimeIn,
                    inspectorTimeOut: doc.inspectorTimeOut,
                    contractAdministrator: doc.contractAdministrator,
                    isChargeable: doc.IsChargable,
                    supportCA: doc.supportCA,
                    images: doc.images.length ? doc.image.map(item => ({ path: `${process.env.Base_Url}/${item}` })) : [],
                    createdAt: doc.createdAt,
                    updatedAt: doc.updatedAt,
                    dailyDiary: doc.dailyDiaries || [],
                    dailyEntries: doc.dailyEntries || [],

                },

            };
        });


        if (formattedList) {
            res.status(200).json({
                status: true,
                message: 'Weekly report list',
                result: formattedList
            })
        } else {
            res.status(200).json({
                status: true,
                message: 'No user has uploaded their weekly report',
                result: formattedList
            })

        }


    } catch (error) {

        res.status(500).json({ message: `Error fetching getWeeklyEntryList ${error}` });
    }
});

module.exports = router;
