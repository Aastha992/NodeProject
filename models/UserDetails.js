const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Improved user schema with coordinate validation
const UserDetailsSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: String,  // Optional by default
    lastName: String,   // Optional by default
    latitude: {
        type: Number,
        validate: {
            validator: function(v) {
                return typeof v === 'number' && 
                       v >= -90 && 
                       v <= 90;
            },
            message: 'Latitude must be a number between -90 and 90'
        }
    },
    longitude: {
        type: Number,
        validate: {
            validator: function(v) {
                return typeof v === 'number' && 
                       v >= -180 && 
                       v <= 180;
            },
            message: 'Longitude must be a number between -180 and 180'
        }
    },
    verificationCode: String,
    codeExpiration: Date
});

// Add coordinate type conversion for existing string data
UserDetailsSchema.pre('save', function(next) {
    // Convert string coordinates to numbers
    if (typeof this.latitude === 'string') {
        this.latitude = parseFloat(this.latitude);
    }
    if (typeof this.longitude === 'string') {  
        this.longitude = parseFloat(this.longitude)
    }
    
    // Preserve existing login functionality
    next();
});

// Existing auth methods - PRESERVED WITHOUT CHANGES
UserDetailsSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const UserDetails = mongoose.model('UserDetails', UserDetailsSchema);
module.exports = UserDetails;