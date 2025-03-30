const HttpError = require("../Model/http-error");
const attendanceModel = require("../Model/attendanceModel");
const courseModel = require("../Model/courseModel");
const studentModel = require("../Model/studentModel");

// Create attendance record by professor
async function handleCreateAttendanceRecord(req, res, next) {
  const { courseName, batch } = req.body;

  // validate if course name is provided
  if (!courseName || !batch) {
    return next(new HttpError("Inputs not provided", 422));
  }

  let course;

  // fetch the course with the courseName
  try {
    course = await courseModel.findOne({ name: courseName, batch: batch });
  } catch (err) {
    return next(new HttpError("Cannot fetch course, try later", 500));
  }

  if (!course) {
    return next(new HttpError("Could not find courses", 404));
  }

  // create attendance record and save it
  let attendanceRecord = new attendanceModel({
    course: course._id,
    student: [],
    date: Date.now(),
    batch: batch,
  });

  try {
    await attendanceRecord.save();
  } catch (err) {
    return next(
      new HttpError("Cannot take attendance, please try again later", 500)
    );
  }
  // return the attendance record
  res.status(200).json({ record: attendanceRecord });
}

async function handleMarkStudentAttendance(req, res, next) {
  const { uid } = req.body;
  const suid = req.uid;
  // console.log(suid);

  let record;

  try {
    record = await attendanceModel.findById(uid).populate("course");
  } catch (err) {
    return next(
      new HttpError("Cannot fetch attendance record, try later", 500)
    );
  }

  if (!record) {
    return next(new HttpError("Could not find Attendance Record", 404));
  }

  let student;

  try {
    student = await studentModel.findOne({ uid: suid });
  } catch (err) {
    return next(new HttpError("Cannot fetch student, try later", 500));
  }
  // console.log(student);

  if (!student) {
    return next(new HttpError("Could not find Student", 404));
  }

  if (!student.courses.includes(record.course._id)) {
    return next(new HttpError("student does not belong to course", 404));
  }

  if (record.student.includes(student._id)) {
    return next(new HttpError("Attendance already marked", 400));
  }

  record.student.push(student._id);

  try {
    await record.save();
  } catch (err) {
    return next(new HttpError("error marking attendace", 500));
  }

  res.status(200).json({ record: record });
}

async function handleManualAttendance(req, res, next) {
  const { uid, students } = req.body;

  if (!uid || !students) {
    return next(new HttpError("Input fields are required", 422));
  }

  try {
    let attendance = await attendanceModel.findById({ _id: uid });

    if (!attendance) {
      return next(new HttpError("No attendance found", 404));
    }

    for (const rollno of students) {
      let student = await studentModel.findOne({ rollno: rollno });
      if (student) {
        attendance.student.push(student._id);
      }
    }

    await attendance.save();

    res.status(200).json({ attendance });
  } catch (err) {
    return next(new HttpError("Error processing attendance", 500));
  }
}

module.exports = {
  handleCreateAttendanceRecord,
  handleMarkStudentAttendance,
  handleManualAttendance,
};
