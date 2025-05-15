const HttpError = require("../Model/http-error");
const {Attendance, ArchivedAttendance } = require("../Model/attendanceModel");
const {Course, ArchivedCourse} = require("../Model/courseModel");
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
    course = await Course.findOne({ name: courseName, batch: batch });
  } catch (err) {
    return next(new HttpError("Cannot fetch course, try later", 500));
  }

  if (!course) {
    return next(new HttpError("Could not find courses", 404));
  }

  // create attendance record and save it
  let attendanceRecord = new Attendance({
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

  let record;

  try {
    record = await Attendance.findById(uid).populate("course");
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
    let attendance = await Attendance.findById({ _id: uid });

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

async function handleModifyAttendance(req, res, next) {
  let { rollno, id } = req.body;

  if(!rollno || !id){
    return next(new HttpError("Invalid input fields provided", 400));
  }

  if (!Array.isArray(rollno)) {
    rollno = [];
  }

  try {
    // First find the attendance record
    let attendance = await Attendance.findById(id);
    
    if (!attendance) {
      return next(new HttpError("Attendance record not found", 404));
    }
    
    // Array to hold student IDs
    let studentIds = [];
    
    // Find student IDs for each roll number
    for (const roll of rollno) {
      const student = await studentModel.findOne({ rollno: roll });
      if (!student) {
        return next(new HttpError(`Student with roll number ${roll} not found`, 404));
      }
      studentIds.push(student._id);
    }
    
    // Update the attendance document with the new student IDs
    attendance.student = studentIds;
    
    // Save the updated attendance document
    await attendance.save();
    
    // Return the updated attendance with populated student data
    const updatedAttendance = await Attendance.findById(id).populate("student");
    
    return res.status(200).json({
      message: "Attendance updated successfully",
    });
    
  } catch (err) {
    console.error(err);
    return next(new HttpError("Server Error in updating Attendance, please try later", 500));
  }
}

async function handleLiveModifyAttendance(req, res, next) {
  let { id, rollno } = req.body;

  if (!id || !Array.isArray(rollno)) {
    return next(new HttpError("Invalid input fields", 400));
  }

  try {
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return next(new HttpError("Attendance record not found", 404));
    }

    for (const roll of rollno) {
      if (attendance.student.includes(roll)) {
        continue; // Skip if already present
      }

      const student = await studentModel.findOne({ rollno: roll });
      if (!student) {
        console.log(`Student with roll no ${roll} not found.`);
        continue; // Skip if student not found
      }

      attendance.student.push(student._id);
    }

    await attendance.save();
    res.status(200).json({ message: "Successfully modified attendance" });

  } catch (err) {
    console.error(err);
    return next(new HttpError("Server error in modifying attendance", 500));
  }
}

module.exports = {
  handleCreateAttendanceRecord,
  handleMarkStudentAttendance,
  handleManualAttendance,
  handleModifyAttendance,
  handleLiveModifyAttendance
};
