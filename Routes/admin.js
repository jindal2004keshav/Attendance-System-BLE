const express = require("express");
const { handleStudentRegistrationUsingCsv, handleCreateStudentAccount, handleViewCurrentCoursesByAdmin, handleViewArchiveCoursesByAdmin, handleViewAllProfessor, handleViewStudentAttendance } = require("../Controller/adminController");
const { extractToken  } = require("../Middleware/extractUid");
const upload = require('../middleware/multerConfig');

const adminRouter = express.Router();

adminRouter.post("/register/student",upload.single('file'), handleStudentRegistrationUsingCsv);

adminRouter.post("/create/student", handleCreateStudentAccount);

adminRouter.get("/view/current/courses", extractToken, handleViewCurrentCoursesByAdmin);

adminRouter.get("/view/archive/courses", extractToken, handleViewArchiveCoursesByAdmin);

adminRouter.get("/view/professor", extractToken, handleViewAllProfessor);

adminRouter.get("/student/attendance", extractToken, handleViewStudentAttendance);

module.exports = adminRouter;

