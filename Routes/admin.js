const express = require("express");
const { handleStudentRegistrationUsingCsv } = require("../Controller/adminController");
const { extractToken  } = require("../Middleware/extractUid");
const upload = require('../middleware/multerConfig');

const amdinRouter = express.Router();

amdinRouter.post("/register/student",upload.single('file'), handleStudentRegistrationUsingCsv);

// amdinRouter.post("/register/professor",handleProfessorRegistration);

module.exports = amdinRouter;

