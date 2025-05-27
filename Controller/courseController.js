const {Course, ArchivedCourse} = require("../Model/courseModel");
const professorModel = require("../Model/professorModel");
const HttpError = require("../Model/http-error");
const { customAlphabet } = require('nanoid');
const studentModel = require("../Model/studentModel");
const { Attendance, ArchivedAttendance } = require("../Model/attendanceModel");
var cron = require("node-cron")

const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const nanoid = customAlphabet(alphabet, 6);

// View All Students in Course 
async function handleViewStudentsInCourse(req, res, next) {
  const { courseName, batch, isArchived, year, joiningCode } = req.query;

  console.log(joiningCode);

  if (!courseName || !batch || !year || !joiningCode) {
    return next(new HttpError("Input fields are empty", 404));
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
      .populate("students");
  } catch (err) {
    return next(new HttpError("Cannot fetch course, try later", 500));
  }

  if (!course) {
    return next(new HttpError("Could not find course", 404));
  }

  let attendanceRecords;
  try {
    attendanceRecords = await attendanceModel.find({ course: course._id });
  } catch (err) {
    return next(new HttpError("Failed to fetch attendance records", 500));
  }

  const studentList = [];

  for (const student of course.students) {
    const attendedSessions = attendanceRecords.filter(record =>
      record.student.includes(student._id)
    );

    const attendancePercentage =
      attendanceRecords.length > 0
        ? (attendedSessions.length / attendanceRecords.length) * 100
        : 0;

    studentList.push({
      ...student.toObject({ getters: true }),
      attendancePercentage: attendancePercentage.toFixed(2)
    });
  }

  res.json({
    students: studentList
  });
}

// Create Course Request by Professor
async function handleCourseCreation(req, res, next) {
  // professor email to identify professor and coureName (CS330)
  // Expiry Date in the format "date/month/Year"
  const { batch, courseName, courseExpiry } = req.body;
  const uid = req.uid;

  // check if inputs are provided in req.body
  if (!batch || !courseName || !uid || !courseExpiry) {
    return next(new HttpError("Invalid feilds", 422));
  }

  const [day, month, year] = courseExpiry.split("/").map(Number);
  const expiryDate = new Date(year, month - 1, day)

  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  if (expiryDate < today) {
    return next(new HttpError("Course expiry date has already passed", 400));
  }

  // fetch the professor to add course._id created in professor.courses[]
  // and course.createdBy for professor._id
  let professor;
  try {
    professor = await professorModel.findOne({ uid: uid});
  } catch (err) {
    // if fetching professor details failed
    return next(new HttpError("Cannot fetch professor details provided", 500));
  }

  // if professor was not found
  if (!professor) {
    return next(new HttpError("Professor not found", 404));
  }

    // Get current year
    const currentYear = new Date().getFullYear();


  // make a valid course to save()
  const courseCreated = new Course({
    name: courseName,
    batch: batch,
    year: currentYear,
    professor: professor._id,
    students: [],
    courseExpiry: expiryDate,
    joiningCode: nanoid(),
  });


  try {
    // try saving the course and add its ._id to professor.courses
    await courseCreated.save();
    professor.courses.push(courseCreated._id);
    await professor.save();
  } catch (err) {
    // In case saving courses failed
    const error = new HttpError(
      "Creating course failed, please try later",
      500
    );
    return next(error);
  }


  // Return the course created
  res.status(201).json({ course: courseCreated });
}

async function updateExpiredCourses() {

  try {

    const allCourses = await Course.find({});
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const course of allCourses) {
      if (today > course.courseExpiry) {
        // 1. Archive the course
        const archived = new ArchivedCourse(course.toObject());
        archived.courseStatus = 'inactive';
        await archived.save();

        // 2. Remove course reference from professor
        await professorModel.updateOne(
          { _id: course.professor },
          { $pull: { courses: course._id } }
        );

        // 3. Remove course reference from all students
        await studentModel.updateMany(
          { courses: course._id },
          { $pull: { courses: course._id } }
        );

        // 4. Move attendance records to ArchivedAttendance
        const attendanceRecords = await Attendance.find({ course: course._id });
        for (const record of attendanceRecords) {
          const archivedRecord = new ArchivedAttendance(record.toObject());
          archivedRecord.course = archived._id; // Optional: link to archived course
          await archivedRecord.save();
          await Attendance.findByIdAndDelete(record._id);
        }

        // 5. Delete the course
        await Course.findByIdAndDelete(course._id);
      }
    }

    console.log("Expired courses and attendance archived successfully.");
  } catch (err) {
    console.error("Error archiving expired courses:", err);
  }
}

cron.schedule("0 0 * * *", updateExpiredCourses, {
  timezone: "Asia/Kolkata",
}); // Runs daily at midnight

// Update the list of students enrolled in course with provided list, remove or add students and their respective course in student Schema too
async function handleCourseStudents(req, res, next) {
  let { rollno, courseName, batch } = req.body; // Extract student roll numbers array

  if (!courseName || !batch) {
    // check if inputs are provided
    return next(new HttpError("Invalid fields", 422));
  }

  if (!Array.isArray(rollno)) {
    rollno = []; // Default to an empty array if undefined or null
  }

  let course;
  try {
    // fetch the course to be modified
    course = await Course
      .findOne({ name: courseName, batch: batch })
      .populate("students"); // Populate existing students
  } catch (err) {
    return next(new HttpError("Cannot fetch course details", 500));
  }


  // return error if no such course with given courseName is found
  if (!course) {
    return next(new HttpError("Course not found", 404));
  }

  let studentIds = new Set(); // Store new student IDs
  let newStudents = [];

  // extract the ._id for all students rollno provided
  for (const rollNo of rollno) {
    try {
      let student = await studentModel.findOne({ rollno: rollNo }); // Find student by roll number
      if (!student) {
        return next(
          new HttpError(`Student with rollNo ${rollNo} not found`, 404)
        );
      }
      studentIds.add(student._id.toString());
      newStudents.push(student);
      
      // Ensure course is added to student
      if (!student.courses.includes(course._id)) {
        student.courses.push(course._id);
        await student.save();
      }
    } catch (err) {
      return next(new HttpError("Cannot fetch student details", 500));
    }
  }

  // Remove students who are no longer in the list
  for (const oldStudent of course.students) {
    // check if student._id is present in created ._id, if not then it is to be removed
    if (!studentIds.has(oldStudent._id.toString())) {
      //fetch old student
      // const oldStudentFound = await studentModel.findById(oldStudent);
      // remove course._id from student.courses
      oldStudent.courses = oldStudent.courses.filter(
        (id) => id.toString() !== course._id.toString()
      ); // Remove course._id from student
      await oldStudent.save();
    }
  }

  // Update course.students with the new list
  course.students = newStudents.map((s) => s._id);

  // save the course that is updated
  try {
    await course.save();
  } catch (err) {
    return next(new HttpError("Updating course students failed", 500));
  }

  res
    .status(200)
    .json({
      message: "Course students updated successfully",
      students: course.students,
    });
}

module.exports = {
  handleCourseCreation,
  handleCourseStudents,
  handleViewStudentsInCourse,
};
