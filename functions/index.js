const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

/* =====================================================
   GET ADMIN NOTIFICATION TOKENS
===================================================== */

async function getAdminTokens() {
  const snapshot = await db



const {
    onCall,
    HttpsError
} = require("firebase-functions/v2/https");

const {
    initializeApp
} = require("firebase-admin/app");

const {
    getAuth
} = require("firebase-admin/auth");

const {
    getFirestore
} = require("firebase-admin/firestore");


initializeApp();


const db = getFirestore();

const auth = getAuth();


/* =========================================================
   YOUR ADMIN UID
========================================================= */

const ADMIN_UID =
    "28zzG9NB46gRkwia7WtOxS1lQNa2";


/* =========================================================
   MEMBER DATA COLLECTIONS
========================================================= */

const MEMBER_COLLECTIONS = [

    "users",

    "deposits",

    "withdrawals",

    "investments",

    "purchases",

    "earnings",

    "earningsHistory",

    "referralCommissions"

];


/* =========================================================
   DELETE A COLLECTION
========================================================= */

async function deleteCollection(
    collectionName
){

    const snapshot =
        await db
            .collection(collectionName)
            .get();


    if(snapshot.empty){

        return 0;

    }


    let deleted = 0;

    let batch =
        db.batch();

    let batchSize = 0;


    for(
        const document
        of snapshot.docs
    ){

        batch.delete(
            document.ref
        );

        deleted++;

        batchSize++;


        /*
         * Keep batches below Firestore's
         * maximum operation limit.
         */

        if(batchSize >= 400){

            await batch.commit();

            batch =
                db.batch();

            batchSize = 0;

        }

    }


    if(batchSize > 0){

        await batch.commit();

    }


    return deleted;

}


/* =========================================================
   DELETE ALL AUTH USERS EXCEPT ADMIN
========================================================= */

async function deleteMemberAuthUsers(){

    let deletedUsers = 0;

    let pageToken;


    do{

        const result =
            await auth.listUsers(
                1000,
                pageToken
            );


        const memberUsers =
            result.users.filter(
                user =>
                    user.uid !== ADMIN_UID
            );


        /*
         * Firebase allows deleting users
         * in batches.
         */

        if(memberUsers.length > 0){

            const deleteResult =
                await auth.deleteUsers(
                    memberUsers.map(
                        user =>
                            user.uid
                    )
                );


            deletedUsers +=
                deleteResult.successCount;


            if(
                deleteResult.failureCount > 0
            ){

                console.error(
                    "Some Authentication users could not be deleted:",
                    deleteResult.errors
                );

            }

        }


        pageToken =
            result.pageToken;

    }

    while(pageToken);


    return deletedUsers;

}


/* =========================================================
   RESET ALL SKYRENT MEMBER DATA
========================================================= */

exports.resetAllMemberData =
    onCall(
        async (request) => {


            /* =============================================
               REQUIRE FIREBASE LOGIN
            ============================================= */

            if(
                !request.auth
            ){

                throw new HttpsError(
                    "unauthenticated",
                    "You must be logged in as administrator."
                );

            }


            /* =============================================
               REQUIRE ADMIN UID
            ============================================= */

            if(
                request.auth.uid !== ADMIN_UID
            ){

                throw new HttpsError(
                    "permission-denied",
                    "Only the SkyRent administrator can perform this reset."
                );

            }


            try{

                const deletedFirestore =
                    {};


                /* =========================================
                   DELETE MEMBER COLLECTIONS
                ========================================= */

                for(
                    const collectionName
                    of MEMBER_COLLECTIONS
                ){

                    try{

                        deletedFirestore[
                            collectionName
                        ] =
                            await deleteCollection(
                                collectionName
                            );

                    }

                    catch(error){

                        /*
                         * A collection that does not exist
                         * simply contributes zero.
                         */

                        console.log(
                            "Collection skipped:",
                            collectionName,
                            error.message
                        );

                        deletedFirestore[
                            collectionName
                        ] = 0;

                    }

                }


                /* =========================================
                   DELETE AUTH USERS
                ========================================= */

                const deletedAuthUsers =
                    await deleteMemberAuthUsers();


                /* =========================================
                   LOG RESULT
                ========================================= */

                console.log(
                    "SkyRent member reset completed.",
                    {
                        deletedFirestore,
                        deletedAuthUsers
                    }
                );


                /* =========================================
                   RETURN RESULT
                ========================================= */

                return {

                    success:true,

                    message:
                        "All SkyRent member data has been reset.",

                    deletedFirestore,

                    deletedAuthUsers

                };

            }


            catch(error){

                console.error(
                    "SkyRent member reset failed:",
                    error
                );


                throw new HttpsError(
                    "internal",
                    "The member data reset failed. Check Firebase Functions logs."
                );

            }

        }
    );
  
