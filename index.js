require('dotenv').config()
const express = require("express");
const MongooseConnect = require("./connect");
const studentRouter = require("./Routes/student");
const professorRouter = require("./Routes/professor");
const amdinRouter = require("./Routes/admin");
const HttpError = require("./Model/http-error");
const authRouter = require("./Routes/auth");
const { extractToken } = require("./Middleware/extractUid");

const app = express();


MongooseConnect(process.env.DATABASE_URL).then(() => {
    console.log("Database connected");
});


app.use(express.json());
app.use(express.urlencoded({extended: false}));


app.use("/api/student" ,studentRouter);
app.use("/api/professor", professorRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", amdinRouter);


app.use((req, res, next) => {
    const error = new HttpError("Could not find this route", 404);
    throw error;
  });
  

app.use((error, req, res, next) => {
    if (res.headerSent) {
      return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || "An unknown error occurred!" });
  });
  

app.listen(process.env.PORT, "0.0.0.0" ,() => {
    console.log("Server is started");
});