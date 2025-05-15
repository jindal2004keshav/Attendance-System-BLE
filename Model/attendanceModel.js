const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    course: {type: mongoose.Schema.Types.ObjectId, ref: "courseModel", required: true},
    student: [{ type: mongoose.Schema.Types.ObjectId, ref: "studentModel", required: true}],
    date: { type: Date, default: Date.now},
    batch: {type: String, required: true},
}, { timestamps: true });

const Attendance = mongoose.model("Attendance", attendanceSchema, "attendances");
const ArchivedAttendance = mongoose.model("ArchivedAttendance", attendanceSchema, "archived_attendances");

module.exports = {
    Attendance,
    ArchivedAttendance,
  };
  
  