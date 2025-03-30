const express = require("express");
const { handleStudentViewCourse, handleStudentViewAttendance, handleStudentRegistration } = require("../Controller/studentController");
const { handleMarkStudentAttendance } = require("../Controller/attendanceController");
const { extractToken  } = require("../Middleware/extractUid");

const studentRouter = express.Router();

studentRouter.get("/courses", extractToken ,handleStudentViewCourse); // extract Token

studentRouter.get("/attendance", extractToken, handleStudentViewAttendance); // extract Token

studentRouter.post("/register", handleStudentRegistration);

studentRouter.post("/attendance", extractToken, handleMarkStudentAttendance);  // extractToken

module.exports = studentRouter;