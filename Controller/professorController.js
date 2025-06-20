const professorModel = require("../Model/professorModel");
const {Course, ArchivedCourse} = require("../Model/courseModel");
const {Attendance, ArchivedAttendance } = require("../Model/attendanceModel");
const studentModel = require("../Model/studentModel");
const HttpError = require("../Model/http-error");

// Professor Registration
async function handleProfessorRegistration(req, res, next) {
  // get name and email and verify if they are being provided
  const { name, email } = req.body;
  const uid = req.headers.authorization.split(" ")[1];
  if (!name || !email || !uid) {
    return next(new HttpError("All fields are required", 422));
  }

  // create a professor record
  const professorCreated = new professorModel({
    name: name,
    email: email,
    courses: [],
    uid: uid,
  });

  // save professor record or catch error and return created professor if successfully created
  try {
    professorCreated.save();
  } catch (err) {
    const error = new HttpError(
      "Could not register professor, please try again later",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: professorCreated.toObject({ getters: true }) });
}

// View Courses Created by Professor 
async function handleViewCoursesByProfessor(req, res, next) {
  const uid = req.uid;

  if (!uid) {
    return next(new HttpError("not provided uid", 400));
  }

  // extract professor and populate it with its courses
  let professor;
  try {
    professor = await professorModel.findOne({ uid: uid }).populate("courses");
  } catch (err) {
    return next(
      new HttpError("Fetching professor failed, please try again later.", 500)
    );
  }

  // verify if successfully fetched
  if (!professor) {
    return next(new HttpError("Could not find professor", 404));
  }

  // return all the courses as objects
  res.json({
    courses: professor.courses.map((course) =>
      course.toObject({ getters: true })
    ),
  });
}

// View all the archived courses by professor
async function handleViewArchivedCoursesByProfessor(req, res, next) {
  const uid = req.uid;

  if (!uid) {
    return next(new HttpError("Uid not provided", 400));
  }

  let professor;
  try {
    professor = await professorModel.findOne({ uid });
    if (!professor) {
      return next(new HttpError("Professor not found", 404));
    }
  } catch (err) {
    return next(new HttpError("Fetching professor details failed", 500));
  }

  let courses;
  try {
    courses = await ArchivedCourse.find({ professor: professor._id });
  } catch (err) {
    return next(new HttpError("Fetching archived courses failed, please try later", 500));
  }

  res.json({
    courses: courses.map(course => course.toObject({ getters: true }))
  });
}

// View all students
async function handleViewAllStudents(req, res, next) {
  let students;

  try {
    students = await studentModel.find({});
  } catch (err) {
    return next(new HttpError("Cannot fetch Students", 500));
  }

  res.status(200).json({
    student: students.map((student) => student.toObject({ getters: true })),
  });
}

// Fetch all the attendance records for a course
async function handleViewAllAttendanceRecords(req, res, next) {
  const { joiningCode, courseName, batch, year, isArchived } = req.query;

 
  if (!courseName || !batch || !year || !joiningCode) {
    return next(new HttpError("Invalid Inputs", 422));
  }

  if (isArchived === undefined || isArchived === null) {
      return next(new HttpError("Info for archive is not provided", 400));
  }

  const isArchivedBool = isArchived === "true";
  const model = isArchivedBool ? ArchivedCourse : Course;
  const attendanceModel = isArchivedBool ? ArchivedAttendance : Attendance;

  let course;
  try {
    course = await model
      .findOne({ name: courseName, batch: batch, year: year, joiningCode: joiningCode })
  } catch (err) {
    return next(new HttpError("Cannot fetch course, try later", 500));
  }

  if (!course) {
    return next(new HttpError("Could not find course", 404));
  }

  let attendanceRecords;
  try {
    attendanceRecords = await attendanceModel.find({
      course: course._id
    });
  } catch (err) {
    return next(new HttpError("Failed to fetch attendance records", 500));
  }

  if (!attendanceRecords) {
    return next(
      new HttpError("No attendance records found for this course", 404)
    );
  }

  res.json({
    records: attendanceRecords.map((record) =>
      record.toObject({ getters: true })
    ),
  });
}

async function handleViewRecordData(req, res, next) {
  const { recordId, isArchived } = req.query;

  if (isArchived === undefined || isArchived === null) {
    return next(new HttpError("Info for archive is not provided", 400));
  } 

  const isArchivedBool = isArchived === "true";
  const model = isArchivedBool ? ArchivedCourse : Course;
  const attendanceModel = isArchivedBool ? ArchivedAttendance : Attendance;

  if (!recordId) {
    return next(new HttpError("Invalid Inputs", 422));
  }

  let records;

  try {
    records = await attendanceModel.findById({
      _id: recordId,
    });
  } catch (err) {
    return next(new HttpError("Failed to fetch attendance records", 500));
  }

  if (!records) {
    return next(
      new HttpError("No attendance records found for this course", 404)
    );
  }

  const courseId = records.course;

  let course;

  // fetch the course with the courseName
  try {
    course = await model.findById({ _id: courseId }).populate("students");
  } catch (err) {
    return next(new HttpError("Cannot fetch course, try later", 500));
  }

  if (!course) {
    return next(new HttpError("Could not find course", 404));
  }

  const attendanceStatus = course.students.map((student) => ({
    rollno: student.rollno,
    name: student.name,
    status: records.student.includes(student._id) ? "Present" : "Absent",
  }));

  res.json({ attendance: attendanceStatus });
}

// Complete attendance record for excel 
async function handleProfessorViewAttendance(req, res, next) {
  const { courseName, batch, year, isArchived, joiningCode } = req.query;


  if (isArchived === undefined || isArchived === null || joiningCode == null) {
    return next(new HttpError("Info for archive is not provided", 400));
  } 

  const isArchivedBool = isArchived === "true";
  const model = isArchivedBool ? ArchivedCourse : Course;
  const attendanceModel = isArchivedBool ? ArchivedAttendance : Attendance;

  let course;
  try {
    course = await model
      .findOne({ name: courseName, batch: batch, year: year, joiningCode: joiningCode })
      .populate("students");
  } catch (err) {
    return next(new HttpError("Cannot fetch course, try later", 500));
  }

  if (!course) {
    return next(new HttpError("Could not find course", 404));
  }

  const students = course.students;
  if (!students || students.length === 0) {
    return next(new HttpError("No students found", 404));
  }

  let attendanceRecords;
  try {
    attendanceRecords = await attendanceModel.find({
      course: course._id,
    });
  } catch (err) {
    return next(new HttpError("Failed to fetch attendance records", 500));
  }

  if (!attendanceRecords || attendanceRecords.length === 0) {
    return next(new HttpError("No attendance records found for this course", 404));
  }

  // **Create the Attendance Sheet**
  const attendanceSheet = [];

  // Loop through all attendance records and store them as separate objects
  attendanceRecords.forEach((record) => {
    const dateStr = record.date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD

    let recordEntry = {
      date: dateStr,
      attendance: {},
    };

    // Mark all students as "Absent" initially
    students.forEach((student) => {
      recordEntry.attendance[student.rollno] = "Absent";
    });

    // Mark students as "Present" if they are in the record
    record.student.forEach((presentStudent) => {
      const foundStudent = students.find((s) => s._id.equals(presentStudent));
      if (foundStudent) {
        recordEntry.attendance[foundStudent.rollno] = "Present";
      }
    });

    // Store each record separately in an array
    attendanceSheet.push(recordEntry);
  });

  res.status(200).json({ attendanceSheet });
}

async function handleProfessorProfile(req, res, next) {
  const uid = req.uid;

  if(!uid){
    return next(new HttpError("No uid provided", 400));
  }

  let professor;

  try{
    professor = await professorModel.findOne({uid: uid}).populate("courses");
  } catch (err){
    return next(new HttpError("Server error in finding profile", 500));
  }

  if(!professor){
    return next(new HttpError("No professor found", 404));
  }

  return res.status(200).json(professor.toObject());
}


module.exports = {
  handleProfessorRegistration,
  handleViewCoursesByProfessor,
  handleProfessorViewAttendance,
  handleViewAllStudents,
  handleViewAllAttendanceRecords,
  handleViewRecordData,
  handleViewArchivedCoursesByProfessor,
  handleProfessorProfile
};
