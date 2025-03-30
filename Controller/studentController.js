const studentModel = require("../Model/studentModel");
const HttpError = require("../Model/http-error");
const courseModel = require("../Model/courseModel");
const attendanceModel = require("../Model/attendanceModel");

// Register the student
async function handleStudentRegistration(req, res, next) {
  const { name, rollno, email } = req.body;
  const uid = req.headers.authorization.split(" ")[1];

  if (!name || !rollno || !email || !uid) {
    return next(new HttpError("Invalid inputs", 422));
  }
  const studentCreated = new studentModel({
    name: name,
    rollno: rollno,
    email: email,
    courses: [],
    uid: uid,
    batch: []
  });
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

// find all the courses a student is enrolled in
async function handleStudentViewCourse(req, res, next) {
  const uid = req.uid;
  // console.log(uid);
  // const {rollno} = req.body;

  // extract student and populate it with its courses
  let student;
  try {
    student = await studentModel
      .findOne({ uid: uid })
      .populate("courses");
  } catch (err) {
    const error = new HttpError(
      "Fetching student failed, please try again later.",
      500
    );
    return next(error);
  }

  // verify if successfully fetched
  if (!student) {
    return next(
      new HttpError("Could not find the provided student", 404)
    );
  }

  // return all the courses as objects
  res.json({
    courses: student.courses.map((course) =>
      course.toObject({ getters: true })
    ),
  });
}

// View the attendance of student
async function handleStudentViewAttendance(req, res, next) {
  const { courseName, batch } = req.query;
  const uid = req.uid;
  // console.log(uid)
  // const courseName = req.params.cid;

  
  if(!batch || !courseName){
    return next(
      new HttpError("Invalid Inputs", 422)
    );
  }

  let student;
  try {
    student = await studentModel.findOne({ uid: uid });
  } catch (err) {
    return next(new HttpError("Cannot fetch student, try later", 500));
  }

  if (!student) {
    return next(new HttpError("Could not find student", 404));
  }

  let course;

  // fetch the course with the courseName
  try {
    course = await courseModel.findOne({ name: courseName, batch: batch });
  } catch (err) {
    return next(new HttpError("Cannot fetch course, try later", 500));
  }

  if (!course) {
    return next(new HttpError("Could not find course", 404));
  }

  let attendanceRecords;
  try {
      attendanceRecords = await attendanceModel.find({ course: course._id});
  } catch (err) {
      return next(new HttpError("Failed to fetch attendance records", 500));
  }

  if (!attendanceRecords) {
    return next(new HttpError("No attendance records found for this course", 404));
  }

  // **Format attendance data with present/absent status**
  const attendanceStatus = attendanceRecords.map(record => ({
    date: record.date.toISOString().split("T")[0], // Format date
    status: record.student.includes(student._id) ? "Present" : "Absent" // Check if student is in the record
  }));

  // console.log(attendanceStatus);
  res.status(200).json({ attendance: attendanceStatus });

}

module.exports = {
  handleStudentViewCourse,
  handleStudentViewAttendance,
  handleStudentRegistration,
};
