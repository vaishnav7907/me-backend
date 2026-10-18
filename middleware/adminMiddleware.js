const jwt = require("jsonwebtoken");
const authModel = require("../model/authentication/authentication");

const adminMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Authorization header missing in admin middleware" });
    }
  } catch (error) {}
};
module.exports = { adminMiddleware };
