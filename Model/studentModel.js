const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollno: { type: Number, unique: true, required: true }, 
    email: { type: String, unique: true, required: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "courseModel" }],
    uid: {type: String, unique: true, required: true},
    batch: [{type: String}]
});

module.exports = mongoose.model("studentModel", studentSchema, "students");