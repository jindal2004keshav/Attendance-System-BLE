const HttpError = require("../Model/http-error");
const studentModel = require("../Model/studentModel");
const professorModel = require("../Model/professorModel");

async function handleAuthRequest(req, res, next) {

  const uid = req.headers.authorization.split(" ")[1];
    if (!uid) {
        return next(new HttpError("uid not provided", 422));
    }
    // console.log(uid);
    let student;
    try {
        student = await studentModel.findOne({ uid: uid });
    } catch (err) {
        return next(new HttpError("Cannot fetch student, try later", 500));
    }
    
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


  if(!student && !professor){
    return next(
        new HttpError("user with provided uid not found", 404)
    )
  };

  if(!professor){
    res.status(200).json({role: "student"});
  }

  if(!student){
    res.status(200).json({role: "professor"});
  }

}

module.exports = {
  handleAuthRequest,
};
