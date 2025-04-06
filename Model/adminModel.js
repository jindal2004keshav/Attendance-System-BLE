const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true},
    email: {type: String, unique: true, required: true},
    college: {type: String, required: true},
    uid: {type: String, unique: true, required: true},
});

module.exports = mongoose.model("adminModel", adminSchema, "admins");