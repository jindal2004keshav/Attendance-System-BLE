const mongoose = require("mongoose");

const professorSchema = new mongoose.Schema({
    name: { type: String, required: true},
    email: {type: String, unique: true, required: true},
    courses: [{type: mongoose.Schema.Types.ObjectId, ref: "courseModel"}],
    uid: {type: String, unique: true, required: true}
});

module.exports = mongoose.model("professorModel", professorSchema, "professors");