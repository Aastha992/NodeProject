const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
  

  
  // Allow specific routes to bypass authentication
  const publicPaths = ['/api/schedules'];
  if (publicPaths.includes(req.path)) {

    return next();
  }  


  // Extract token from the Authorization header
  const authHeader = req.header("Authorization");
  if (!authHeader) {

    return res.status(403).json({ message: "Access denied. Token missing." });
  }

  const token = authHeader.split(" ")[1]; // Extract the token


  if (!token) {
    return res.status(403).json({ message: "Access denied. Token missing." });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
 
        return res.status(403).json({ message: "Invalid token. Token has expired." });
      }

      return res.status(403).json({ message: "Invalid token." });
    }


    // Attach user info to request object
    req.user = user;

    // Proceed to the next middleware or route
    next();
  });
}

module.exports = authenticateJWT;
