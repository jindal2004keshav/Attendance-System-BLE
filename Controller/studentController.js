const studentModel = require("../Model/studentModel");
const HttpError = require("../Model/http-error");
const {Course, ArchivedCourse} = require("../Model/courseModel");
const {Attendance, ArchivedAttendance } = require("../Model/attendanceModel");

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

// get the Student Profile
async function handleStudentProfile(req, res, next){
  const uid = req.uid;

  let student;

  try{
    student = await studentModel.findOne({uid: uid}).populate("courses");
  } catch (err){
    return next(new HttpError("Server error in finding student profile", 500));
  }

  if(!student){
    return next(new HttpError("No student Found", 404));
  }

  res.status(200).json(student.toObject());
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
    course = await Course.findOne({ name: courseName, batch: batch });
  } catch (err) {
    return next(new HttpError("Cannot fetch course, try later", 500));
  }

  if (!course) {
    return next(new HttpError("Could not find course", 404));
  }

  let attendanceRecords;
  try {
      attendanceRecords = await Attendance.find({ course: course._id});
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

async function handleStudentJoinCourse(req, res, next){
  const uid = req.uid;

  const {joiningCode} = req.body;

  let course;

  try{
    course = await Course.findOne({joiningCode: joiningCode});
  } catch(err){
    return next( new HttpError("Server error in finding course", 500));
  }

  if(!course){
    return next(new HttpError("Course not found for provided joining Code"), 404);
  }

  let student;

  try{
    student = await studentModel.findOne({uid: uid});
  } catch (err){
    return next(new HttpError("Server error in finding student", 500));
  }

  if(!student){
    return next(new HttpError("Student not found"));
  }

  if (student.courses.includes(course._id.toString())) {
    return next(new HttpError("Student is already part of the course", 208));
  }
  


  student.courses.push(course._id);
  course.students.push(student._id);

  try{
    student.save();
    course.save();
  } catch(err){
    return next(new HttpError("Server error Adding studnet to course, please try again later", 500));
  }

  res.status(200).json({message: "Successfully added student to course"});
}

module.exports = {
  handleStudentViewCourse,
  handleStudentViewAttendance,
  handleStudentRegistration,
  handleStudentJoinCourse,
  handleStudentProfile
};
