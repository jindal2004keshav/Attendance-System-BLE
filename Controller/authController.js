const HttpError = require("../Model/http-error");
const studentModel = require("../Model/studentModel");
const professorModel = require("../Model/professorModel");
const adminModel = require("../Model/adminModel");
const { deviceBinding } = require("../Model/deviceBindingModel");

async function handleAuthRequest(req, res, next) {

  // console.log("request received");
  const uid = req.headers.authorization?.split(" ")[1];
  if (!uid) {
    return next(new HttpError("uid not provided", 422));
  }

  const { androidId } = req.query;
  let student, professor, admin;

  try {
    student = await studentModel.findOne({ uid });
  } catch (err) {
    return next(new HttpError("Cannot fetch student, try later", 500));
  }

  try {
    professor = await professorModel.findOne({ uid });
  } catch (err) {
    return next(new HttpError("Fetching professor failed, please try again later.", 500));
  }

  try {
    admin = await adminModel.findOne({ uid });
  } catch (err) {
    return next(new HttpError("Fetching admin failed, please try again later.", 500));
  }

  if (!professor && !admin) {
    if (!student) {
      return next(new HttpError("User with provided uid not found", 404));
    }

    const email = student.email;

    if (!androidId) {
      return next(new HttpError("No android Id provided", 400));
    }

    let record = await deviceBinding.findOne({ androidID: androidId });

    if (!record) {
      record = new deviceBinding({
        androidID: androidId,
        email: email,
      });

      try {
        await record.save(); // Added await here
      } catch (err) {
        return next(new HttpError(`Server error: ${err}`, 500));
      }

      return res.status(200).json({ role: "student" });
    } else {
      if (record.email === email) {
        return res.status(200).json({ role: "student" });
      } else {
        return next(new HttpError("The device does not belong to requested account", 401));
      }
    }
  }

  if (!student && !admin) {
    return res.status(200).json({ role: "professor" });
  }

  if (!student && !professor) {
    return res.status(200).json({ role: "admin" });
  }

  if (!student && !professor && !admin) {
    return next(new HttpError("user with provided uid not found", 404));
  }

  // Optional fallback (if somehow all above branches fail)
  return next(new HttpError("Unhandled role condition", 500));
}

async function handleSimBinding(req, res, next) {
  // console.log("received");
  // console.log("Headers:", req.headers); // ✅ This prints all headers

  const uid = req.headers.authorization?.split(" ")[1];
  // console.log(req.header);
  const SimId = req.headers.simid;
  const AndroidId = req.headers.androidid;
  // console.log(SimId);

  if (!AndroidId) {
    return next(new HttpError("AndroidId not provided", 422));
  }
  if (!SimId) {
    return next(new HttpError("SimId not provided", 422));
  }

  let record;
  
  try {
    record = await deviceBinding.findOne({ androidID: AndroidId });
    
  } catch (err) {
    return next(new HttpError("Server Error finding record", 500));
  }
  
  if (!record) {
    return next(new HttpError("This device is not binded", 404));
  }
  
  let subid = record.subscriptionId;
  // console.log(subid);

    if(!subid){
      record.subscriptionId = SimId;
      try{
        await record.save();
      } catch(err){
        return next(new HttpError("Server error in binding subscriptionId with device", 500));
      }
    }
    else{
      if(subid != SimId){
        return next(new HttpError("A different sim is binded with this deive", 403));
      } else{
        res.status(200).json({message: "Sim bind verification successful"});
      }
    }
}

module.exports = {
  handleAuthRequest,
  handleSimBinding
};
