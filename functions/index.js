const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();


// ================================
// NEW USER REGISTRATION NOTIFICATION
// ================================

exports.newUserRegistrationNotification =
functions.firestore
.document("users/{userId}")
.onCreate(async (snap, context)=>{

    const userData = snap.data();


    const userName =
    userData.name || "New User";


    const userPhone =
    userData.phone || "";


    // Get Admin Notification Token
    const adminDoc =
    await db.collection("admins")
    .doc("28zzG9NB46gRkwia7WtOxS1lQNa2")
    .get();


    if(!adminDoc.exists){

        console.log(
        "Admin notification token not found"
        );

        return null;
    }


    const token =
    adminDoc.data().notificationToken;


    if(!token){

        console.log(
        "No notification token saved"
        );

        return null;
    }



    const message = {

        token: token,

        notification: {

            title:
            "🚀 New SkyRent Member Registered",

            body:
            `${userName} joined SkyRent ${userPhone}`

        },

        data: {

            type:
            "new_registration",

            userId:
            context.params.userId

        }

    };



    try{

        await admin.messaging()
        .send(message);


        console.log(
        "Registration notification sent"
        );


    }
    catch(error){

        console.error(
        "Notification error:",
        error
        );

    }


    return null;

});
