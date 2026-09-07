const authModel = require("../../model/authentication/authentication");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userSignUp = async (req, res) => {
  try {
    const { FullName, Email, Password } = req.body;
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
        id: createUser._id,
        name: createUser.FullName,
        email: createUser.Email,
        role: createUser.role,
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
    const { FullName, Email, Password } = req.body;
    const emailExist = await authModel.findOne({ Email });

    if (emailExist) {
      return res.status(409).json({ message: "email already exist" });
    }

    const existingFullname = await authModel.findOne({ FullName });

    if (existingFullname) {
      return res.status(409).json({ message: "fullname already exist" });
    }

    const hashedpassword = await bcrypt.hash(Password, 10);
    const createadmin = await authModel.create({
      FullName,
      Email,
      Password: hashedpassword,
      role: "admin",
    });

    res.status(201).json({
      message: "User registered successfully",
      admin: {
        id: createadmin._id,
        name: createadmin.FullName,
        email: createadmin.Email,
        role: createadmin.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Signup failed",
      error: error.message,
    });
  }
};

const userAdminLogin = async (req, res) => {
  try {
    const { FullName, Password } = req.body;
    if (!FullName || !Password) {
      return res
        .status(400)
        .json({ message: "fullname and password are required" });
    }

    const exist = await authModel.findOne({ FullName });

    if (!exist) {
      return res.status(404).json({ message: "User not found" });
    }

      // Only admin can access admin login
    if (exist.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }
    const isPasswordMatch = await bcrypt.compare(Password, exist.Password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: exist._id,
        role: exist.role,
      },
      process.env.JWT_SECRETE,
      { expiresIn: "1d" },
    );
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: exist._id,
        name: exist.FullName,
        email: exist.Email,
        role: exist.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

module.exports = { userSignUp, adminSignUp, userAdminLogin };
