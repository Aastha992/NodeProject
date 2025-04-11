const mongoose = require("mongoose");

// Define the schema for Photo Files
const PhotoFileSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserDetails', required: true }, // To associate the photo with a specific user
		photo: { type: String, required: true }, // Path or URL of the photo
		location: { type: String, required: true }, // Location where the photo was taken
		folder_name: { type: String, required: true },
		date: { type: String, required: true }, // Date the photo was taken
		time: { type: String, required: true }, // Time the photo was taken
		description: { type: String },
		projectId : { type: mongoose.Schema.Types.ObjectId, ref: 'Project'}
	},
	{
		collection: "PhotoFiles", // MongoDB collection name
		timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
	}
);

// Define the model based on the schema
const PhotoFiles = mongoose.model("PhotoFiles", PhotoFileSchema);

module.exports = PhotoFiles;
