const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserDetails'); // Assuming this is your user model

// Register function
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  // Check if email domain is correct
  const domain = '@kps.ca';
  if (!email.endsWith(domain)) {
    return res.status(400).json({ message: `Email must end with ${domain}` });
  }

  // Check if email or password is missing
  if (!email || !password || !username) {
    return res.status(400).json({ message: 'All fields are required: username, email, and password' });
  }

  // Check if user already exists
  const oldUser = await User.findOne({ email });
  if (oldUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Validate password (optional)
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Return success message
    res.status(201).json({
      status: 'User Registered Successfully',
      data: 'User Created',
    });
  } catch (error) {
    console.error('Error registering user:', error);  // Log for debugging
    res.status(500).json({
      status: 'Failed to Register User',
      error: error.message,
    });
  }
};

// Login function
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });  // Use 404 for "not found"
    }

    // Log the user object to check if the password field is found
    console.log('User found:', user);

    // Compare the password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,  // Ensure this exists in your .env file
      { expiresIn: '1h' }
    );

    // Send the token to the client
    res.status(200).json({ message: 'Login successful', token });

  } catch (error) {
    console.error('Error logging in:', error);  // Log for debugging
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
};
