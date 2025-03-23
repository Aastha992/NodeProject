const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
// Import models
const UserInfo = require("./models/UserDetails");
const ExpenseInfo = require("./models/expense");
const DailyEntry = require("./models/dailyEntry");
const WeeklyEntry = require("./models/weeklyEntry");
const DailyDiary = require("./models/dailyDiary");
const JobHazard = require("./models/jobHazard");
const PhotoFiles = require("./models/PhotoFiles");
const Schedule = require("./models/Schedule");
const MileageInfo = require("./models/mileage");


// Import routes
const authRoutes = require("./routes/authRoutes");
const locationWeatherRoutes = require("./routes/locationWeatherRoutes");
const scheduleRoutes = require("./routes/schedules");
const expenseRoutes = require("./routes/expenseRoutes");
const dailyEntryRoutes = require("./routes/dailyEntryRoutes");
const weeklyEntryRoutes = require("./routes/weeklyEntryRoutes");
const dailyDiaryRoutes = require("./routes/dailyDiaryRoutes");
const jobHazardRoutes = require("./routes/JobHazardRoutes");
const photoFilesRoutes = require("./routes/PhotoFilesRoutes");
const mileageRoutes = require("./routes/mileageRoutes");
const projectRoutes = require("./routes/projectsRoutes");
const reports = require("./routes/weeklyReportsRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const logoRoutes = require("./routes/logoRoutes");

//Connect mongo here.
require("./config/db")();

// JWT Authentication Middleware
const authenticateJWT = require("./utils/authenticateJWT");


// Create Express app
const app = express();

// Middleware
// Middleware
app.use(cors());
app.use(express.json({ limit: "100mb" })); 
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(morgan("dev"));

// Serve static files from the 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/location", locationWeatherRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/photos",  photoFilesRoutes);
app.use("/api/expense", authenticateJWT, expenseRoutes);
app.use("/api/daily", dailyEntryRoutes);
app.use("/api/weekly", weeklyEntryRoutes);
app.use("/api/reports", reports);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/diary/daily-diary", dailyDiaryRoutes);
app.use("/api/jha", authenticateJWT, jobHazardRoutes);
app.use("/api/logos", logoRoutes);
app.use("/api/mileage", authenticateJWT, mileageRoutes);




// Utility Routes (Direct database access - may move to a separate file for better organization)
app.get("/fetch", async (req, res) => {
    try {
        const data = await ExpenseInfo.find();
        res.json(data);
    } catch (error) {
         console.error("Error fetching data:", error);
        res.status(500).json({ message: "Error fetching data", error });
    }
  });

  app.get("/fetch/:id", async (req, res) => {
    try {
      const data = await ExpenseInfo.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ message: "Data not found" });
      }
      res.json(data);
    } catch (error) {
         console.error("Error fetching data:", error);
      res.status(500).json({ message: "Error fetching data", error });
    }
  });

// Utility Routes (e.g., Verify Code)
app.post("/api/auth/verify-code", async (req, res) => {
    const { email, code } = req.body;

    try {
        const user = await UserInfo.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        if (user.verificationCode !== code) {
             return res.status(400).json({ message: "Invalid code" });
         }
        if (new Date() > user.codeExpiration) {
            return res.status(400).json({ message: "Code has expired" });
         }
        res.status(200).json({ message: "Code verified successfully" });
        } catch (error) {
            console.error("Error verifying code:", error);
            res.status(500).json({ message: "Server error", error });
        }
    });

// Fetch Additional Data
app.get("/api/jha/fetch-job-hazard", authenticateJWT, async (req, res) => {
    console.log("API Call made to /api/jha/fetch-job-hazard");
    try {
      const data = await JobHazard.find();
      res.json(data);
    } catch (error) {
      console.error("Error fetching job hazard data:", error);
      res.status(500).json({ message: "Error fetching data", error });
    }
  });

  app.get("/api/daily/fetch-daily-entry", authenticateJWT, async (req, res) => {
    try {
      const data = await DailyEntry.find();
      res.json(data);
    } catch (error) {
      console.error("Error fetching daily entry data:", error);
      res.status(500).json({ message: "Error fetching data", error });
    }
  });

  app.get("/api/weekly/fetch-weekly-entry", authenticateJWT, async (req, res) => {
    try {
      const data = await WeeklyEntry.find();
      res.json(data);
    } catch (error) {
      console.error("Error fetching weekly entry data:", error);
      res.status(500).json({ message: "Error fetching data", error });
    }
  });

  app.get("/api/photos/fetch-photo-files", authenticateJWT, async (req, res) => {
    try {
      const data = await PhotoFiles.find();
      res.json(data);
    } catch (error) {
      console.error("Error fetching photo files:", error);
      res.status(500).json({ message: "Error fetching data", error });
    }
  });

  app.get("/api/diary/fetch-daily-diary", authenticateJWT, async (req, res) => {
    try {
      const data = await DailyDiary.find();
      res.json(data);
    } catch (error) {
      console.error("Error fetching daily diary data:", error);
      res.status(500).json({ message: "Error fetching data", error });
    }
  });


// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
 

// app.post("/expense", async (req, res) => {
// 	console.log(req.body);
// 	const {
// 		employeeName,
// 		startDate,
// 		endDate,
// 		expenditure,
// 		projectNumber,
// 		category,
// 		task,
// 		// categoryTitle,
// 		expenses,
// 		totalAmount,
// 	} = req.body;
// 	try {
// 		await ExpenseInfo.create({
// 			employeeName,
// 			startDate,
// 			endDate,
// 			expenditure,
// 			projectNumber,
// 			category,
// 			task,
// 			// categoryTitle,
// 			expenses,
// 			totalAmount,
// 		});
// 		res.status(200).json({
// 			status: "successfull",
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			status: "Failed to insert data",
// 			error: error.message,
// 		});
// 	}
// });

// app.post("/daily-entry", async (req, res) => {
// 	console.log(req.body);
// 	const {
// 		selectedDate,
// 		location,
// 		onShore,
// 		tempHigh,
// 		tempLow,
// 		weather,
// 		workingDay,
// 		reportNo,
// 		projectNumber,
// 		project,
// 		owner,
// 		contract,
// 		contractor,
// 		siteInspector,
// 		timeIn,
// 		OwnerContact,
// 		projectManager,
// 		component,
// 		equipments,
// 		labours,
// 		visitors,
// 		description,
// 	} = req.body;
// 	try {
// 		await DailyEntry.create({
// 			selectedDate,
// 			location,
// 			onShore,
// 			tempHigh,
// 			tempLow,
// 			weather,
// 			workingDay,
// 			reportNo,
// 			projectNumber,
// 			project,
// 			owner,
// 			contract,
// 			contractor,
// 			siteInspector,
// 			timeIn,
// 			OwnerContact,
// 			projectManager,
// 			component,
// 			equipments,
// 			labours,
// 			visitors,
// 			description,
// 		});
// 		res.status(200).json({
// 			status: "successfull",
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			status: "Failed to insert data",
// 			error: error.message,
// 		});
// 	}
// });

// app.post("/weekly-entry", async (req, res) => {
// 	console.log(req.body);
// 	const {
// 		project,
// 		client,
// 		projectManager,
// 		projectNumber,
// 		contractNumber,
// 		date,
// 		associatedProjectManager,
// 		contractProjectManager,
// 		contractSiteSupervisorOnshore,
// 		contractSiteSupervisorOffshore,
// 		contractAdministrator,
// 		supportCA,
// 		residentSiteInspector,
// 		timeIn,
// 		timeOut,
// 		selectedDay,
// 		dayDetails,
// 	} = req.body;
// 	try {
// 		await WeeklyEntry.create({
// 			project,
// 			client,
// 			projectManager,
// 			projectNumber,
// 			contractNumber,
// 			date,
// 			associatedProjectManager,
// 			contractProjectManager,
// 			contractSiteSupervisorOnshore,
// 			contractSiteSupervisorOffshore,
// 			contractAdministrator,
// 			supportCA,
// 			residentSiteInspector,
// 			timeIn,
// 			timeOut,
// 			selectedDay,
// 			dayDetails,
// 		});
// 		res.status(200).json({
// 			status: "successfull",
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			status: "Failed to insert data",
// 			error: error.message,
// 		});
// 	}
// });

// app.post("/daily-diary", async (req, res) => {
// 	console.log(req.body);
// 	const { projectNumber, projectName, date, location, description } = req.body;
// 	try {
// 		await DailyDiary.create({
// 			projectNumber,
// 			projectName,
// 			date,
// 			location,
// 			description,
// 		});
// 		res.status(200).json({
// 			status: "successfull",
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			status: "Failed to insert data",
// 			error: error.message,
// 		});
// 	}
// });

// app.post("/job-hazard", async (req, res) => {
// 	console.log(req.body);
// 	const {
// 		selectedDate,
// 		time,
// 		location,
// 		projectName,
// 		description,
// 		checkedItems,
// 		tasks,
// 		workers,
// 		reviewedBy,
// 		reviewSignature,
// 		dateReviewed,
// 	} = req.body;
// 	try {
// 		await JobHazard.create({
// 			selectedDate,
// 			time,
// 			location,
// 			projectName,
// 			description,
// 			checkedItems,
// 			tasks,
// 			workers,
// 			reviewedBy,
// 			reviewSignature,
// 			dateReviewed,
// 		});
// 		res.status(200).json({
// 			status: "successfull",
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			status: "Failed to insert data",
// 			error: error.message,
// 		});
// 	}
// });

// app.post("/photo-files", async (req, res) => {
// 	const { photo } = req.body;
// 	try {
// 		await PhotoFiles.create({
// 			photo,
// 		});
// 		res.status(200).json({
// 			status: "successfull",
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			status: "Failed to insert data",
// 			error: error.message,
// 		});
// 	}
// });
