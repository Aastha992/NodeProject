// hashPassword.js
const bcrypt = require("bcryptjs");

const plainPassword = "password123";  // The plain password you want to hash

bcrypt.hash(plainPassword, 10, (err, hashedPassword) => {
  if (err) throw err;
  console.log("Hashed Password:", hashedPassword);  // This will print the hashed password
});
