const courseModel = require("../Model/courseModel");
const professorModel = require("../Model/professorModel");
const HttpError = require("../Model/http-error");
const studentModel = require("../Model/studentModel");

// Create Course Request by Professor
async function handleCourseCreation(req, res, next) {
  // professor email to identify professor and coureName (CS330)
  const { batch, courseName } = req.body;
  const uid = req.uid;

  // check if inputs are provided in req.body
  if (!batch || !courseName || !uid) {
    return next(new HttpError("Invalid feilds", 422));
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

  // make a valid course to save()
  const courseCreated = new courseModel({
    name: courseName,
    professor: professor._id,
    batch: batch,
    students: [],
  });

  try {
    // try saving the course and add its ._id to professor.courses
    // Must have used sessions but this is standalong instance so not required,
    // A replica set is a group of MongoDB servers that keep copies of the same data for fault tolerance,
    // Transactions only work on replica sets which is by default supported by Mongo Atlas
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

// Update the list of students enrolled in course with provided list, remove or add students and their respective course in student Schema too
async function handleCourseStudents(req, res, next) {
  let { rollno, courseName, batch } = req.body; // Extract student roll numbers array
  
  // console.log(rollno);
  // console.log(batch);
  // console.log(courseName);

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
    course = await courseModel
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

async function handleViewStudentsInCourse(req, res, next) {
  // const courseName = req.params.cid;
  const { courseName, batch } = req.query;
  if(!courseName || !batch){
    return next(new HttpError("Input feild are empty", 404));
  }

  let course;

  // fetch the course with the courseName
  try {
    course = await courseModel
      .findOne({ name: courseName, batch: batch })
      .populate("students");
  } catch (err) {
    return next(new HttpError("Cannot fetch course, try later", 500));
  }

  if (!course) {
    return next(new HttpError("Could not find course", 404));
  }

  res.json({
    student: course.students.map((student) =>
      student.toObject({ getters: true })
    ),
  });
}

module.exports = {
  handleCourseCreation,
  handleCourseStudents,
  handleViewStudentsInCourse,
};
