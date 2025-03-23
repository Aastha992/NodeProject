const { default: mongoose } = require("mongoose");

const UserInfoSchemaJobHazard = new mongoose.Schema(
	{
		selectedDate: { type: Date, required: true },
		time: { type: String, required: true },
		location: { type: String, required: true, trim: true },
		projectName: { type: String, required: true, trim: true },
		description: { type: String, required: true, trim: true },
		checkedItems: { type: Array, default: [] }, // Default to empty array if not provided
		tasks: { type: Array, default: [] }, // Default to empty array if not provided
		workers: { type: Array, required: true, validate: v => v.length > 0 }, // Must include at least one worker
		reviewedBy: { type: String, required: true, trim: true },
		reviewSignature: { type: String, required: true },
		dateReviewed: { type: Date, required: true },
	},
	{
		collection: "JobHazard",
	}
);

// Define the model based on the schema
const JobHazard = mongoose.model("JobHazard", UserInfoSchemaJobHazard);

module.exports = JobHazard;
