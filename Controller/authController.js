const HttpError = require("../Model/http-error");
const studentModel = require("../Model/studentModel");
const professorModel = require("../Model/professorModel");
const adminModel = require("../Model/adminModel");
const {deviceBinding} = require("../Model/deviceBindingModel");

async function handleAuthRequest(req, res, next) {
  console.log("received");

  const uid = req.headers.authorization.split(" ")[1];
    if (!uid) {
        return next(new HttpError("uid not provided", 422));
    }

    const {androidId} = req.query;
    let student;
    try {
        student = await studentModel.findOne({ uid: uid });
    } catch (err) {
        return next(new HttpError("Cannot fetch student, try later", 500));
    }
    // console.log("student: ", student);
    
    let professor;
    try {
      professor = await professorModel
      .findOne({ uid: uid })
    } catch (err) {
      const error = new HttpError(
        "Fetching professor failed, please try again later.",
        500
      );
      return next(error);
    }
    // console.log("professor : ", professor);
    
    let admin;
    try {
      admin = await adminModel
      .findOne({ uid: uid })
    } catch (err) {
      const error = new HttpError(
        "Fetching professor failed, please try again later.",
        500
      );
      return next(error);
    }
    // console.log("admin : ", admin);
    
    if(!professor && !admin){

      let email = student.email;
      console.log(email);

      if(!androidId){
        return next(new HttpError("No android Id provided", 400));
      }

      let record;
      record = await deviceBinding.findOne({androidID: androidId});
      // console.log(record);

      if(!record){

        record = new deviceBinding({
          androidID: androidId,
          email: email
        });

        try{
          record.save();
        } catch(err){
          // console.log(err);
          return next(new HttpError(`Server error: ${err}`, 500));
        }
        res.status(200).json({role: "student"});
      } else{
        if(record.email === email){
          res.status(200).json({role: "student"});
        } else{
          console.log("success");
          return next(new HttpError("The device does not belong to requested account", 401));
        }
      }
    }
    
    if(!student && !admin){
      res.status(200).json({role: "professor"});
    }
    
    if(!student && !professor){
      res.status(200).json({role: "admin"});
    }
    
    if(!student && !professor && !admin){
      return next(
          new HttpError("user with provided uid not found", 404)
      )
    };


}

module.exports = {
  handleAuthRequest,
};
