const jwt = require("jsonwebtoken");
const User = require("../models/User");
const generateToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: "El email ya esta registrado." });
    const user = await User.create({ name, email, password });
    const token = generateToken(user);
    return res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { return res.status(500).json({ success: false, message: "Error interno." }); }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email y contrasena son obligatorios." });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
    const token = generateToken(user);
    return res.status(200).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { return res.status(500).json({ success: false, message: "Error interno." }); }
};
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.status(200).json({ success: true, user });
  } catch (e) { return res.status(500).json({ success: false, message: "Error." }); }
};
module.exports = { register, login, getMe };
