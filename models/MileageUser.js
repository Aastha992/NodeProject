const mongoose = require("mongoose");
const MileageUserSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true, // Ensures no duplicate userId
        required: true,
    },
});

module.exports = mongoose.models.MileageUser || mongoose.model("MileageUser", MileageUserSchema);