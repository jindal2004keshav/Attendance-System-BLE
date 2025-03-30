const mongoose = require('mongoose');

async function MongooseConnect(url) { 
    // console.log("mogo connected")
    return mongoose.connect(url);
}

module.exports = MongooseConnect;