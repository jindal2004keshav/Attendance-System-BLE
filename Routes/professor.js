const express = require("express");
const {handleProfessorRegistration, handleViewCoursesByProfessor, handleProfessorViewAttendance, handleViewAllStudents, handleViewAllAttendanceRecords, handleViewRecordData} = require("../Controller/professorController");
const { handleCourseCreation, handleCourseStudents, handleViewStudentsInCourse} = require("../Controller/courseController");
const { handleCreateAttendanceRecord, handleManualAttendance } = require("../Controller/attendanceController");
const { extractToken  } = require("../Middleware/extractUid");
const router = express.Router();

router.post("/register",handleProfessorRegistration);

router.get("/course", extractToken ,handleViewCoursesByProfessor);  // extract Token

router.get("/course/student", handleViewStudentsInCourse);

router.post("/course", extractToken ,handleCourseCreation);  // extract Token

router.get("/students", handleViewAllStudents);  

router.patch("/course", handleCourseStudents); 

router.post("/attendance", handleCreateAttendanceRecord);

router.get("/attendance/course", handleViewAllAttendanceRecords);

router.get("/attendance/record", handleViewRecordData);

router.patch("/attendance/manual", handleManualAttendance);

//TODO
router.get("/fullattendance", handleProfessorViewAttendance);



module.exports = router;
