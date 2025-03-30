const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    course: {type: mongoose.Schema.Types.ObjectId, ref: "courseModel", required: true},
    student: [{ type: mongoose.Schema.Types.ObjectId, ref: "studentModel", required: true}],
    date: { type: Date, default: Date.now},
    batch: {type: String, required: true},
})

module.exports = mongoose.model("Attendance", attendanceSchema, "attendances");