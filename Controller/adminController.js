const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const validator = require("validator");

const professorModel = require("../Model/professorModel");
const studentModel = require("../Model/studentModel");
const HttpError = require("../Model/http-error");
const firebaseadmin = require("firebase-admin");

const serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));

if (!firebaseadmin.apps.length) {
    firebaseadmin.initializeApp({
        credential: firebaseadmin.credential.cert(serviceAccount),
    });
}
  
async function handleStudentRegistrationUsingCsv(req, res, next) {
    console.log("CSV upload request received");
    if (!req.file) {
        return next(new HttpError("CSV file is required", 400));
    }


    const results = [];
    const errors = [];
    const filePath = req.file.path;

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on("data", (row) => {
                    results.push(row);
                })
                .on("end", resolve)
                .on("error", reject);
        });

        for (const student of results) {
            // Trim and normalize fields
            const name = student.name?.trim();
            const email = student.email?.replace(/\s+/g, "").toLowerCase();
            const rollno = student.rollno?.trim();
            const password = student.password?.trim();

            // Basic validation
            if (!email || !password || !name || !rollno) {
                errors.push({ email: email || "N/A", error: "Missing required fields" });
                continue;
            }

            if (!validator.isEmail(email)) {
                errors.push({ email, error: "Invalid email format" });
                continue;
            }

            try {
                // Create Firebase Auth User
                const userRecord = await firebaseadmin.auth().createUser({
                    email,
                    password,
                });

                // Save to MongoDB
                const uid = userRecord.uid;
                const newStudent = new studentModel({
                    name,
                    rollno,
                    email,
                    courses: [],
                    uid,
                    batch: [],
                });

                await newStudent.save();
            } catch (err) {
                console.error(`Error creating user ${email}:`, err.message);
                errors.push({ email, error: err.message });
            }
        }

        // Clean up uploaded CSV
        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting file:", err);
        });

        res.status(200).json({
            message: "Processing complete",
            total: results.length,
            errors,
            success: results.length - errors.length,
        });
    } catch (err) {
        console.error("CSV processing failed:", err.message);
        fs.unlink(filePath, () => {}); // still attempt cleanup
        return next(new HttpError("Something went wrong while processing CSV", 500));
    }
}



module.exports = {
    handleStudentRegistrationUsingCsv,
};
