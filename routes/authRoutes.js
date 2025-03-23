const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmails');
const User = require('../models/UserDetails');
const router = express.Router();
const authenticateJWT = require("../utils/authenticateJWT");
const common = require("../utils/common.util");

// Registration route
router.post('/register', async (req, res) => {
    const { email, password, username } = req.body;

    try {
        // Check if email or username already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return common.success(req, res, { message: 'Email or Username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = await User.create({
            email,
            password: hashedPassword,
            username,
        });
        const resp = newUser.toObject();
        resp['userId'] = resp._id;
        [resp.password, resp.__v, resp._id] = [];
        // Respond with success
        return common.success(req, res, { message: 'User registered successfully', data: resp });
    } catch (error) {
        return common.error(req, res, { message: 'Server error' });
    }
});

// Location update route
router.post('/update-location', async (req, res) => {
    const { userId, latitude, longitude } = req.body;

    try {
        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update the user's location
        user.latitude = latitude;
        user.longitude = longitude;
        await user.save();

        res.status(200).json({ message: "User location updated successfully" });
    } catch (error) {
        console.error("Error updating location", error);
        res.status(500).json({ message: "Error updating location" });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("Login request received:", req.body);

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        console.log("User data : ", user)
        if (!user) {
            console.log("User not found.")
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Invalid password")
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if the logged-in user is Paul (the boss)
        const isBoss = email === "paul.kusiar@kps.ca"; //Change to Paul's actual email

        // Generate a JWT token
        const token = jwt.sign({ userId: user._id, isBoss }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Respond with the token and userId
        res.status(200).json({
            status: "success",
            message: "User logged in successfully",
            data: {
                token: token,
                userId: user._id,
                isBoss: isBoss // Send this to frontend
            }
        });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email not found' });
        }

        // Generate a random 4-digit code for verification
        const code = Math.floor(1000 + Math.random() * 9000);

        // Set the expiration time for the code (10 minutes)
        const expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 10);  // Code expires in 10 minutes

        // Save the code and expiration to the user's data
        user.verificationCode = code;
        user.codeExpiration = expiration;
        await user.save();

        // Send the verification email
        sendEmail(email, code);  // Send email with the verification code

        // Respond with a success message
        res.status(200).json({ message: 'Verification code sent to email' });
    } catch (error) {
        console.error("Error in forgot-password route", error);
        if (error.response) {
            return res.status(500).json({ message: error.response?.data?.message || 'Server error, please try again later.' });
        }
        return res.status(500).json({ message: error.message || 'Server error, please try again later.' });
    }
});

// Verify Code route
router.post('/verify-code', async (req, res) => {
    const { email, code } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if the entered code matches the stored code
        if (user.verificationCode !== code) {
            return res.status(400).json({ message: 'Invalid code' });
        }

        // Check if the code has expired
        if (new Date() > user.codeExpiration) {
            return res.status(400).json({ message: 'Code has expired' });
        }

        // Code is valid, proceed to the next step (e.g., password reset)
        res.status(200).json({ message: 'Code verified successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        // Step 1: Validate the email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Step 2: Validate the new password (e.g., length check)
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        // Step 3: Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Step 4: Update the password in the database
        user.password = hashedPassword;
        await user.save();

        // Step 5: Respond with success
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
});

// Get User Profile (New Route)
router.get("/profile", authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Determine if user is Paul (the Boss)
        const isBoss = user.email === "paul.kusiar@kps.ca"; // Update if needed

        res.json({
            username: user.username,
            email: user.email,
            isBoss: isBoss, // Add isBoss flag
            latitude: user.latitude,
            longitude: user.longitude
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Export the routes
module.exports = router;