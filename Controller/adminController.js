const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const validator = require("validator");

const professorModel = require("../Model/professorModel");
const {Course, ArchivedCourse} = require("../Model/courseModel");
const {Attendance, ArchivedAttendance} = require("../Model/attendanceModel");
const studentModel = require("../Model/studentModel");
const HttpError = require("../Model/http-error");
const firebaseadmin = require("firebase-admin");

const serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));

if (!firebaseadmin.apps.length) {
    firebaseadmin.initializeApp({
        credential: firebaseadmin.credential.cert(serviceAccount),
    });
}
  
// register students/professor using csv
async function handleStudentRegistrationUsingCsv(req, res, next) {
    if (!req.file) {
        return next(new HttpError("CSV file is required", 400));
    }

    const isProfesor = req.headers;
    const results = [];
    const errors = [];
    const filePath = req.file.path;

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on("data", (row) => results.push(row))
                .on("end", resolve)
                .on("error", reject);
        });

        for (const student of results) {
            const cleanedStudent = {};
            for (const key in student) {
                const trimmedKey = key.trim().replace(/^\uFEFF/, "");
                cleanedStudent[trimmedKey] = student[key].trim();
            }

            let { name, email, password } = cleanedStudent;
            let rollno = null;
            if (!isProfesor) {
                rollno = cleanedStudent.rollno;
            }

            if (!email || !name || (!isProfesor && !rollno)) {
                errors.push({ email: email || "N/A", error: "Missing required fields" });
                continue;
            }

            if (!password) {
                password = email.split("@")[0];
            }

            if (!validator.isEmail(email)) {
                errors.push({ email, error: "Invalid email format" });
                continue;
            }

            try {
                const userRecord = await firebaseadmin.auth().createUser({
                    email,
                    password,
                });

                const uid = userRecord.uid;
                let newStudent;

                if (!isProfesor) {
                    newStudent = new studentModel({
                        name,
                        rollno,
                        email,
                        courses: [],
                        uid,
                        batch: [],
                    });
                } else {
                    newStudent = new professorModel({
                        name,
                        email,
                        courses: [],
                        uid,
                    });
                }

                await newStudent.save();
            } catch (err) {
                errors.push({ email, error: err.message });
            }
        }

        fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete file:", err);
        });

        res.status(200).json({
            message: "Processing complete",
            total: results.length,
            errors,
            success: results.length - errors.length,
        });
    } catch (err) {
        fs.unlink(filePath, () => {});
        return next(new HttpError("Something went wrong while processing CSV", 500));
    }
}

// Register a single student profile
async function handleCreateStudentAccount(req, res, next){
    const { name, rollno, email, isProfessor } = req.body;

  const uid = req.headers.authorization.split(" ")[1];

  if (!name || !email || !uid || isProfessor == null) {
    return next(new HttpError("Invalid inputs", 422));
}


if(!isProfessor && !rollno){
    return next(new HttpError("Invalid inputs", 422));
  }
  
  let studentCreated;

  if(isProfessor){
    studentCreated = new professorModel({
        name: name,
        email: email,
        courses: [],
        uid: uid
    })
  } else{
      studentCreated = new studentModel({
        name: name,
        rollno: rollno,
        email: email,
        courses: [],
        uid: uid,
        batch: []
      });
  }

  try {
    await studentCreated.save();
  } catch (err) {
    const error = new HttpError("Registration failed, please tyr again.", 500);
    return next(error);
  }
  return res
    .status(200)
    .json({ user: studentCreated.toObject({ getters: true }) });
}

// View all courses
async function handleViewCurrentCoursesByAdmin(req, res, next) {

  const uid = req.uid;

  if (!uid) {
    return next(new HttpError("not provided uid", 400));
  }

  // Fetch all courses using Mongoose
  let courses;
  try {
    courses = await Course.find({});
  } catch (err) {
    return next(
      new HttpError("Fetching courses failed, please try again later.", 500)
    );
  }

  // Check if courses were found
  if (!courses || courses.length === 0) {
    return next(new HttpError("Could not find courses", 404));
  }

  // Return all courses
  res.json({
    courses: courses.map((course) => course.toObject({ getters: true })),
  });
}

async function handleViewArchiveCoursesByAdmin(req, res, next) {

  const uid = req.uid;

  if (!uid) {
    return next(new HttpError("not provided uid", 400));
  }

  // Fetch all courses using Mongoose
  let courses;
  try {
    courses = await ArchivedCourse.find({});
  } catch (err) {
    return next(
      new HttpError("Fetching courses failed, please try again later.", 500)
    );
  }

  // Check if courses were found
  if (!courses || courses.length === 0) {
    return next(new HttpError("Could not find courses", 404));
  }

  // Return all courses
  res.json({
    courses: courses.map((course) => course.toObject({ getters: true })),
  });
}

// View all professor
async function handleViewAllProfessor(req, res, next) {
  let professors;

  try {
    professors = await professorModel.find({});
  } catch (err) {
    return next(new HttpError("Cannot fetch Professors", 500));
  }

  res.status(200).json({
    professor: professors.map((professor) => professor.toObject({ getters: true })),
  });
}

async function handleViewStudentAttendance(req, res, next) {
  const { name, rollno } = req.query;
  
  if (!name || !rollno) {
    return next(new HttpError("Fields cannot be empty", 400));
  }
  
  const cleanedRollno = rollno.replace(/[^\d]/g, '');
  const roll = parseInt(cleanedRollno, 10);
  const nameClean = name.trim();
  console.log(cleanedRollno)
  
  if (isNaN(roll)) {
    return next(new HttpError("Invalid roll number", 400));
  }
  
  try {
    const student = await studentModel
    .findOne({ rollno: roll, name: nameClean })
    .populate("courses"); 
    console.log(student)
    
    if (!student) {
      return next(new HttpError("No student found with provided rollNo and name", 404));
    }

    const attendance = [];

    if (student.courses.length === 0) {
      console.log("no courses")
      // attendance.push()
      return next(new HttpError("No courses Enrolled", 404));
    }

    for (const course of student.courses) {
      let allAttendanceRecords;

      try {
        allAttendanceRecords = await Attendance.find({ course: course._id });
      } catch (err) {
        return next(new HttpError("Server error in finding attendance", 500));
      }

      let presentCount = 0;
      for (const record of allAttendanceRecords) {
        if (Array.isArray(record.student)) {
          if (record.student.includes(student._id)) {
            presentCount++;
          }
        } else {
          if (record.student.toString() === student._id.toString()) {
            presentCount++;
          }
        }
      }

      attendance.push({
        course: course.name,
        batch: course.batch, 
        courseYear: course.year,
        presentCount,
        totalTaken: allAttendanceRecords.length,
      });
    }

    return res.status(200).json({ attendanceData: attendance });

  } catch (err) {
    console.error(err);
    return next(new HttpError("Server Error finding student", 500));
  }
}

module.exports = {
    handleStudentRegistrationUsingCsv,
    handleCreateStudentAccount,
    handleViewCurrentCoursesByAdmin,
    handleViewArchiveCoursesByAdmin,
    handleViewAllProfessor,
    handleViewStudentAttendance
};
