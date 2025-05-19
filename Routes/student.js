const express = require("express");
const { handleStudentViewCourse, handleStudentViewAttendance, handleStudentRegistration, handleStudentJoinCourse, handleStudentProfile } = require("../Controller/studentController");
const { handleMarkStudentAttendance } = require("../Controller/attendanceController");
const {handleSimBinding} = require("../Controller/authController");
const { extractToken  } = require("../Middleware/extractUid");

const studentRouter = express.Router();

studentRouter.get("/courses", extractToken ,handleStudentViewCourse); // extract Token

studentRouter.get("/attendance", extractToken, handleStudentViewAttendance); // extract Token

studentRouter.post("/register", handleStudentRegistration);

studentRouter.post("/attendance", extractToken, handleMarkStudentAttendance);  // extractToken

studentRouter.post("/course/join", extractToken, handleStudentJoinCourse);

studentRouter.get("/profile", extractToken, handleStudentProfile);

studentRouter.get("/sim", handleSimBinding)
module.exports = studentRouter;