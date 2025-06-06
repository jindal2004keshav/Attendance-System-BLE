const express = require("express");
const {
  handleProfessorRegistration,
  handleViewCoursesByProfessor,
  handleProfessorViewAttendance,
  handleViewAllStudents,
  handleViewAllAttendanceRecords,
  handleViewRecordData,
  handleViewArchivedCoursesByProfessor,
  handleProfessorProfile
} = require("../Controller/professorController");
const {
  handleCourseCreation,
  handleCourseStudents,
  handleViewStudentsInCourse,
} = require("../Controller/courseController");
const {
  handleCreateAttendanceRecord,
  handleManualAttendance,
  handleModifyAttendance,
  handleLiveModifyAttendance,
} = require("../Controller/attendanceController");
const { extractToken } = require("../Middleware/extractUid");
const router = express.Router();

router.post("/register", handleProfessorRegistration);

router.get("/course/current", extractToken, handleViewCoursesByProfessor); // extract Token

router.get(
  "/course/archived",
  extractToken,
  handleViewArchivedCoursesByProfessor
);

// View all students in the course
router.get("/course/student", handleViewStudentsInCourse);

router.post("/course", extractToken, handleCourseCreation); // extract Token

// View All students
router.get("/students", handleViewAllStudents);

router.patch("/course", handleCourseStudents);

router.post("/attendance", extractToken, handleCreateAttendanceRecord);

// View all the record for a selected course
router.get("/attendance/course", handleViewAllAttendanceRecords);

router.get("/attendance/record", handleViewRecordData);

router.patch("/attendance/manual", handleManualAttendance);

router.patch("/attendance/modify", extractToken, handleModifyAttendance);

router.patch(
  "/attendance/live/modify",
  extractToken,
  handleLiveModifyAttendance
);

// get the complete attendance for excel
router.get("/fullattendance", handleProfessorViewAttendance);

router.get("/profile", extractToken, handleProfessorProfile);

module.exports = router;
