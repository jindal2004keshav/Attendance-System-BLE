const express = require("express");
const { handleStudentRegistrationUsingCsv, handleCreateStudentAccount, handleViewCurrentCoursesByAdmin, handleViewArchiveCoursesByAdmin } = require("../Controller/adminController");
const { extractToken  } = require("../Middleware/extractUid");
const upload = require('../middleware/multerConfig');

const adminRouter = express.Router();

adminRouter.post("/register/student",upload.single('file'), handleStudentRegistrationUsingCsv);

adminRouter.post("/create/student", handleCreateStudentAccount);

adminRouter.get("/view/current/courses", extractToken, handleViewCurrentCoursesByAdmin);

adminRouter.get("/view/archive/courses", extractToken, handleViewArchiveCoursesByAdmin);

// amdinRouter.post("/register/professor",handleProfessorRegistration);

module.exports = adminRouter;

