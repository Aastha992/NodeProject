const mongoose = require("mongoose");

const EmailSchema = new mongoose.Schema({
    email: { type: String, required: true ,unique: true  }, 
    isActive: { type: Boolean, required: true }

});

module.exports = mongoose.model("Email", EmailSchema);
