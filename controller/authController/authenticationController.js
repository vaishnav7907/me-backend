const authModel = require("../../model/authentication/authentication");
const bcrypt = require("bcrypt");
const userSignUp = async (req, res) => {
  try {
    const { FullName, Email, Password, role } = req.body;
    const existingemail = await authModel.findOne({ Email });
    if (existingemail) {
      return res.status(409).json({ message: "email already exist" });
    }

    const existingusername = await authModel.findOne({ FullName });

    if (existingusername) {
      return res.status(409).json({ message: "username already exist" });
    }

    const hashed = await bcrypt.hash(Password, 10);
    const createUser = await authModel.create({
      FullName,
      Email,
      Password: hashed,
      role: "user",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: authModel._id,
        name: authModel.FullName,
        email: authModel.Email,
        password: authModel.Password,
        role: authModel.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Signup failed",
      error: error.message,
    });
  }
};

const adminSignUp = async (req, res) => {
  try {

    
  } catch (error) {}
};

module.exports = { userSignUp };
