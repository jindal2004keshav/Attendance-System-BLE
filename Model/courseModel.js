const mongoose = require("mongoose");

const courseSchema = mongoose.Schema({
    name : {type: String, required: true},
    professor: { type: mongoose.Schema.Types.ObjectId, ref: "professorModel", required: true},
    batch: {type: String, required: true},
    students: [{type: mongoose.Schema.Types.ObjectId, ref: "studentModel"}]
});

module.exports = mongoose.model("courseModel", courseSchema, "courses");
