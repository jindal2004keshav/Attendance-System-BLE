const mongoose = require("mongoose");

const courseSchema = mongoose.Schema({
    name : {type: String, required: true},
    batch: {type: String, required: true},
    year: {type: Number, required: true},
    professor: { type: mongoose.Schema.Types.ObjectId, ref: "professorModel", required: true},
    students: [{type: mongoose.Schema.Types.ObjectId, ref: "studentModel"}],
    courseStatus: {type: String, enum: ['active', 'inactive'], default: "active"},
    courseExpiry: {type: Date},
    joiningCode: {type: String, required: true}
}, {timeStamps: true});

const Course = mongoose.model("courseModel", courseSchema, "courses");
const ArchivedCourse = mongoose.model("archieveCourseModel", courseSchema, "archived_courses");

module.exports = {
    Course,
    ArchivedCourse,
  };
  
