const express = require("express");
const { getLocationWeather } = require("../controllers/locationWeatherController");

const router = express.Router();

// Define the route
router.post("/getLocationAndWeather", getLocationWeather);

module.exports = router;
