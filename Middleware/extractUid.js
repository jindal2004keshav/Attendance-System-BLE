const admin = require("firebase-admin");
const HttpError = require("../Model/http-error");
const path = require("path");


const serviceAccount = require(path.join(__dirname, "../practice-73079651-firebase-adminsdk-fbsvc-1b19b9ce6f.json")); 

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function extractToken(req, res, next){
    if(!req.headers.authorization){
        return next(
            new HttpError("Firebase token not provided", 422)
        );
    }
    const tokenid = req.headers.authorization.split(" ")[1];
    // console.log(tokenid);

    if(!tokenid){
        return next(
            new HttpError("No tokenId provided", 401)
        );
    }

    try {
        // Verify Firebase Token
        const decodedToken = await admin.auth().verifyIdToken(tokenid);
        // console.log(decodedToken);
        req.uid = decodedToken.uid; // ✅ Attach decoded user info to request
        // console.log(req.uid);
        next();
    } catch (error) {
        return next(
            new HttpError("Token varification failed", 403)
        )
    }

}

module.exports = {extractToken}