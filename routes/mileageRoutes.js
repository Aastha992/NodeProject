const express = require("express");
const axios = require("axios");
const Trip = require("../models/mileage");
const MileageUser = require("../models/MileageUser");
const router = express.Router();
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Helper to parse distance with unit conversion
const parseDistance = (distanceText) => {
  const value = parseFloat(distanceText.replace(/[^0-9.]/g, ""));
  return distanceText.includes("mi") ? value * 1.60934 : value; // Convert miles to km
};

const calculateDistance = async (origin, destination) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await axios.get(url);
    const data = response.data;

    if (data.status !== "OK") {
      return { error: data.error_message || "Could not calculate route" };
    }

    const route = data.routes[0].legs[0];
    const distance = parseDistance(route.distance.text);
    const polyline = data.routes[0].overview_polyline.points;

    return { distance, polyline };

  } catch (error) {
    console.error("Google Maps API Error:", error.message);
    return { error: "Route calculation failed" };
  }
};

// POST /api/mileage/calculate-mileage
router.post("/calculate-mileage", async (req, res) => {
  const { userId, startLocation, constructionSites } = req.body;

  try {
    // Validate input
    if (!userId || !startLocation || !constructionSites?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find or create MileageUser
    let user = await MileageUser.findOne({ userId });
    if (!user) {
      user = new MileageUser({ userId });
      await user.save();
    }

    // Calculate route segments
    const HOME_DEDUCTIBLE = 100; // 100 km deductible
    const RATE_PER_KM = 0.5; // $0.50 per km after deductible

    let totalDistance = 0;
    let totalPayable = 0;
    const routeCoordinates = [];

    // Home -> First Site
    if (constructionSites.length > 0) {
      const firstLeg = await calculateDistance(startLocation, constructionSites[0]);
      if (firstLeg.error) return res.status(400).json({ message: firstLeg.error });
      
      totalDistance += firstLeg.distance;
      totalPayable += Math.max(firstLeg.distance - HOME_DEDUCTIBLE, 0) * RATE_PER_KM;
      routeCoordinates.push(firstLeg.polyline);
    }

    // Between Construction Sites
    for (let i = 0; i < constructionSites.length - 1; i++) {
      const leg = await calculateDistance(constructionSites[i], constructionSites[i + 1]);
      if (leg.error) return res.status(400).json({ message: leg.error });

      totalDistance += leg.distance;
      totalPayable += leg.distance * RATE_PER_KM; // No deductible for inter-site
      routeCoordinates.push(leg.polyline);
    }

    // Last Site -> Home
    if (constructionSites.length > 0) {
      const lastLeg = await calculateDistance(constructionSites.slice(-1)[0], startLocation);
      if (lastLeg.error) return res.status(400).json({ message: lastLeg.error });

      totalDistance += lastLeg.distance;
      totalPayable += Math.max(lastLeg.distance - HOME_DEDUCTIBLE, 0) * RATE_PER_KM;
      routeCoordinates.push(lastLeg.polyline);
    }

    // Save trip
    const newTrip = new Trip({
      user_id: user._id,
      date: new Date(),
      startLocation,
      constructionSites,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      expenses: parseFloat(totalPayable.toFixed(2)),
      routeCoordinates
    });

    await newTrip.save();

    res.status(201).json({
      message: "Trip saved successfully",
      totalDistance: newTrip.totalDistance,
      expenses: newTrip.expenses,
      routeCoordinates: newTrip.routeCoordinates
    });

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error during mileage calculation" });
  }
});


router.get("/history/:userId", async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // Extract startDate and endDate from query

    const user = await MileageUser.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    let query = { user_id: user._id };

    // Add date filters if startDate and endDate are provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const trips = await Trip.find(query)
      .sort({ date: -1 })
      .lean();

    res.json(trips.map(trip => ({
      ...trip,
      totalDistance: trip.totalDistance.toFixed(2),
      expenses: trip.expenses.toFixed(2)
    })));

  } catch (error) {
    console.error("Error fetching history:", error.message);
    res.status(500).json({ message: "Error fetching trip history" });
  }
});

module.exports = router;