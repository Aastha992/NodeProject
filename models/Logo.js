const mongoose = require("mongoose");

const LogoSchema = new mongoose.Schema({
    companyName: { type: String},  // Name of the company
    folder_name: { type: String, required: true },  // Name of the company
    logoUrl: { type: String, required: true }  // URL where the logo is stored
});

module.exports = mongoose.model("Logo", LogoSchema);
