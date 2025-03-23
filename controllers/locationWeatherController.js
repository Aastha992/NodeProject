const axios = require('axios');
const mongoose = require('mongoose');
const UserDetails = require('../models/UserDetails');

exports.getLocationWeather = async (req, res) => {
    const { userId } = req.body;

    try {
        // Validate request parameters
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                error: 'INVALID_REQUEST',
                message: 'Valid user ID is required'
            });
        }

        // Retrieve user details
        const user = await UserDetails.findById(userId).lean();
        if (!user) {
            return res.status(404).json({
                error: 'USER_NOT_FOUND',
                message: 'No user found with the provided ID'
            });
        }

        // Coordinate validation and parsing
        const parseCoordinate = (value, type) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(num)) throw new Error(`Invalid ${type} value: ${value}`);
            if (type === 'latitude' && (num < -90 || num > 90)) {
                throw new Error(`Latitude out of range: ${num}`);
            }
            if (type === 'longitude' && (num < -180 || num > 180)) {
                throw new Error(`Longitude out of range: ${num}`);
            }
            return num;
        };

        const latitude = parseCoordinate(user.latitude, 'latitude');
        const longitude = parseCoordinate(user.longitude, 'longitude');

        // Geocoding service
        let formattedAddress = 'Location unavailable';
        try {
            const geocodeResponse = await axios.get(
                'https://maps.googleapis.com/maps/api/geocode/json',
                {
                    params: {
                        latlng: `${latitude},${longitude}`,
                        key: process.env.GOOGLE_MAPS_API_KEY,
                        language: 'en'
                    },
                    timeout: 5000
                }
            );

            if (geocodeResponse.data.status === 'OK') {
                formattedAddress = geocodeResponse.data.results[0].formatted_address;
            }
        } catch (geocodeError) {
            console.error('Geocoding Service Error:', geocodeError.message);
        }

        // Weather service using OpenWeatherMap
        let weatherInfo = {
            temperature: null,
            condition: 'Weather data unavailable',
            icon: null,
            lastUpdated: null
        };

        try {
            const weatherResponse = await axios.get(
                'https://api.openweathermap.org/data/2.5/weather',
                {
                    params: {
                        lat: latitude,
                        lon: longitude,
                        appid: process.env.OPENWEATHER_API_KEY, // Ensure key is in .env
                        units: 'metric',
                        lang: 'en'
                    },
                    timeout: 5000
                }
            );

            const { main, weather, wind, name } = weatherResponse.data;
            weatherInfo = {
                location: name,
                temperature: main.temp,
                feels_like: main.feels_like,
                condition: weather[0].description,
                icon: `https://openweathermap.org/img/wn/${weather[0].icon}.png`,
                wind_speed: wind.speed,
                humidity: main.humidity
            };

        } catch (weatherError) {
            console.error("Weather API Error:", weatherError.message);
        }

        // Final response
        res.status(200).json({
            location: {
                formattedAddress,
                coordinates: {
                    latitude: parseFloat(latitude.toFixed(6)),
                    longitude: parseFloat(longitude.toFixed(6))
                }
            },
            weather: weatherInfo
        });

    } catch (error) {
        console.error('Weather Controller Error:', error.message);
        res.status(500).json({
            error: 'PROCESSING_ERROR',
            message: error.message
        });
    }
};
