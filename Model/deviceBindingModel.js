const mongoose = require("mongoose");

const deviceBindingSchema = mongoose.Schema({
    androidID: {type: String, required: true},
    email: {type: String, required: true},
}, {TimeStamps: true});

const deviceBinding = mongoose.model("deviceBinding", deviceBindingSchema, "bindings");

module.exports = {deviceBinding};