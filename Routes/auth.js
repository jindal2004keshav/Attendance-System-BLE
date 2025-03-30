const express = require("express");
const { handleAuthRequest } = require("../Controller/authController");

const router = express.Router();


router.get("/", handleAuthRequest);

module.exports = router;