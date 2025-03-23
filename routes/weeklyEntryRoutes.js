const express = require("express");
const router = express.Router();
const WeeklyEntry = require("../models/weeklyEntry");
const DailyEntry = require("../models/dailyEntry");
const DailyDiary = require("../models/dailyDiary");
const common = require("../utils/common.util");

router.post("/weekly-entry", async (req, res) => {
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

    // Convert startDate and endDate to Date format to ensure proper MongoDB query
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
        // Check if project exists and fetch its details
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

        // Debugging logs to check what data is being fetched
        console.log("Daily Entries Found:", dailyEntries);
        console.log("Daily Diaries Found:", dailyDiaries);

        // Auto-fill projectName and projectNumber if missing
        let finalProjectName = projectName;
        let finalProjectNumber = projectNumber;
        
        if (!finalProjectName || !finalProjectNumber) {
            const firstDailyEntry = dailyEntries.length > 0 ? dailyEntries[0] : null;
            if (firstDailyEntry) {
                finalProjectName = finalProjectName || firstDailyEntry.projectName;
                finalProjectNumber = finalProjectNumber || firstDailyEntry.projectNumber;
            }
        }

        // Create the weekly entry
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
            error: error.message
        });
    }
});

module.exports = router;
