const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
  console.log("Inside authenticateJWT middleware");

  
  // Allow specific routes to bypass authentication
  const publicPaths = ['/api/schedules'];
  if (publicPaths.includes(req.path)) {
    console.log(`Skipping authentication for public path: ${req.path}`);
    return next();
  }  


  // Extract token from the Authorization header
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    console.log("Authorization header missing");
    return res.status(403).json({ message: "Access denied. Token missing." });
  }

  const token = authHeader.split(" ")[1]; // Extract the token
  console.log("Received Token:", token);

  if (!token) {
    console.log("Token is missing from Authorization header");
    return res.status(403).json({ message: "Access denied. Token missing." });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.error("JWT verification failed: Token has expired");
        return res.status(403).json({ message: "Invalid token. Token has expired." });
      }
        console.error("JWT verification failed:", err); // Log the error here
      return res.status(403).json({ message: "Invalid token." });
    }

    console.log("Token Verified Successfully:", user);

    // Attach user info to request object
    req.user = user;

    // Proceed to the next middleware or route
    next();
  });
}

module.exports = authenticateJWT;