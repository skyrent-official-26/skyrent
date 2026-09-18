const { onCall, HttpsError } = require("firebase-functions/v2/https");

const { initializeApp } = require("firebase-admin/app");

const {
  getFirestore
} = require("firebase-admin/firestore");

const {
  getAuth
} = require("firebase-admin/auth");


// ======================================================
// INITIALIZE FIREBASE ADMIN
// ======================================================

initializeApp();

const db = getFirestore();
const auth = getAuth();


// ======================================================
// YOUR SKYRENT ADMIN UID
// ======================================================

const ADMIN_UID = "28zzG9NB46gRkwia7WtOxS1lQNa2";


// ======================================================
// COLLECTIONS TO DELETE
//
// These are based on the collections visible in your
// Firebase screenshot plus the collections used by
// your SkyRent system.
// ======================================================

const COLLECTIONS_TO_RESET = [

  "deposits",

  "depositRecords",

  "withdrawals",

  "investments",

  "earnings",

  "commissions",

  "purchases",

  "transactions",

  "referrals"

];


// ======================================================
// RESET SKYRENT REGISTERED DATA
// ======================================================

exports.resetSkyRentData = onCall(
  {
    region: "asia-southeast1",

    timeoutSeconds: 540,

    memory: "512MiB"
  },

  async (request) => {

    console.log("======================================");
    console.log("SKYRENT RESET STARTED");
    console.log("======================================");


    // ==================================================
    // CHECK LOGIN
    // ==================================================

    if (!request.auth) {

      console.error(
        "RESET FAILED: No authenticated user."
      );

      throw new HttpsError(
        "unauthenticated",
        "You must be logged in before resetting SkyRent data."
      );
    }


    // ==================================================
    // CHECK ADMIN UID
    // ==================================================

    console.log(
      "Request made by UID:",
      request.auth.uid
    );


    if (request.auth.uid !== ADMIN_UID) {

      console.error(
        "RESET FAILED: Unauthorized UID:",
        request.auth.uid
      );

      throw new HttpsError(
        "permission-denied",
        "Only the SkyRent administrator can perform this operation."
      );
    }


    // ==================================================
    // CHECK CONFIRMATION
    // ==================================================

    if (
      !request.data ||
      request.data.confirm !== "RESET_SKYRENT_DATA"
    ) {

      console.error(
        "RESET FAILED: Invalid confirmation."
      );

      throw new HttpsError(
        "invalid-argument",
        "Reset confirmation is missing or invalid."
      );
    }


    // ==================================================
    // RESULT OBJECT
    // ==================================================

    const result = {

      firestore: {},

      authUsersFound: 0,

      authUsersDeleted: 0,

      authUsersFailed: 0

    };


    // ==================================================
    // DELETE NORMAL COLLECTIONS
    // ==================================================

    for (
      const collectionName
      of COLLECTIONS_TO_RESET
    ) {

      console.log(
        "--------------------------------------"
      );

      console.log(
        "Processing collection:",
        collectionName
      );


      try {

        // listDocuments() also finds documents that
        // may contain nested subcollections.

        const documentRefs =
          await db
            .collection(collectionName)
            .listDocuments();


        console.log(
          `${collectionName}: found ${documentRefs.length} documents`
        );


        let deletedCount = 0;


        for (
          const documentRef
          of documentRefs
        ) {

          try {

            // recursiveDelete removes the document
            // and all nested subcollection data.

            await db.recursiveDelete(
              documentRef
            );

            deletedCount++;

          } catch (deleteError) {

            console.error(
              `Failed deleting ${documentRef.path}`,
              deleteError
            );

            throw deleteError;
          }
        }


        result.firestore[collectionName] =
          deletedCount;


        console.log(
          `${collectionName}: deleted ${deletedCount}`
        );

      } catch (error) {

        console.error(
          `ERROR processing ${collectionName}:`,
          error
        );


        throw new HttpsError(
          "internal",
          `Failed deleting collection "${collectionName}". ${error.message}`
        );
      }
    }


    // ==================================================
    // DELETE USERS
    //
    // IMPORTANT:
    // ADMIN USER DOCUMENT IS PRESERVED
    // ==================================================

    console.log(
      "--------------------------------------"
    );

    console.log(
      "Processing users collection..."
    );


    try {

      const userRefs =
        await db
          .collection("users")
          .listDocuments();


      console.log(
        `users: found ${userRefs.length} documents`
      );


      let deletedUserDocuments = 0;

      let adminPreserved = false;


      for (
        const userRef
        of userRefs
      ) {

        // ==============================================
        // NEVER DELETE ADMIN DOCUMENT
        // ==============================================

        if (
          userRef.id === ADMIN_UID
        ) {

          console.log(
            "ADMIN USER DOCUMENT PRESERVED:",
            userRef.path
          );

          adminPreserved = true;

          continue;
        }


        try {

          await db.recursiveDelete(
            userRef
          );

          deletedUserDocuments++;

        } catch (deleteError) {

          console.error(
            `Failed deleting user ${userRef.path}:`,
            deleteError
          );

          throw deleteError;
        }
      }


      result.firestore.users =
        deletedUserDocuments;


      result.firestore.adminUserPreserved =
        adminPreserved;


      console.log(
        `Deleted ${deletedUserDocuments} user documents`
      );


      console.log(
        "Admin user preserved:",
        adminPreserved
      );

    } catch (error) {

      console.error(
        "ERROR processing users:",
        error
      );


      throw new HttpsError(
        "internal",
        `Failed deleting users. ${error.message}`
      );
    }


    // ==================================================
    // GET ALL FIREBASE AUTH USERS
    // ==================================================

    console.log(
      "--------------------------------------"
    );

    console.log(
      "Loading Firebase Authentication users..."
    );


    try {

      const usersToDelete = [];

      let pageToken;


      // ================================================
      // GET EVERY AUTH USER
      // ================================================

      do {

        const page =
          await auth.listUsers(
            1000,
            pageToken
          );


        console.log(
          `Firebase Auth page contains ${page.users.length} users`
        );


        for (
          const user
          of page.users
        ) {

          // ============================================
          // NEVER DELETE ADMIN AUTH ACCOUNT
          // ============================================

          if (
            user.uid === ADMIN_UID
          ) {

            console.log(
              "ADMIN AUTH ACCOUNT PRESERVED:",
              user.uid
            );

            continue;
          }


          usersToDelete.push(
            user.uid
          );
        }


        pageToken =
          page.pageToken;


      } while (pageToken);


      result.authUsersFound =
        usersToDelete.length;


      console.log(
        `Auth users to delete: ${usersToDelete.length}`
      );


      // ================================================
      // DELETE AUTH USERS IN BATCHES
      // ================================================

      for (
        let i = 0;
        i < usersToDelete.length;
        i += 1000
      ) {

        const batch =
          usersToDelete.slice(
            i,
            i + 1000
          );


        if (
          batch.length === 0
        ) {
          continue;
        }


        console.log(
          `Deleting Auth batch ${i + 1} - ${i + batch.length}`
        );


        const deleteResult =
          await auth.deleteUsers(
            batch
          );


        result.authUsersDeleted +=
          deleteResult.successCount;


        result.authUsersFailed +=
          deleteResult.failureCount;


        console.log(
          "Auth batch result:",
          {
            success:
              deleteResult.successCount,

            failed:
              deleteResult.failureCount
          }
        );


        // ==============================================
        // LOG INDIVIDUAL FAILURES
        // ==============================================

        if (
          deleteResult.failureCount > 0
        ) {

          console.error(
            "Authentication deletion errors:"
          );


          for (
            const error
            of deleteResult.errors
          ) {

            console.error(
              error
            );
          }
        }
      }

    } catch (error) {

      console.error(
        "ERROR deleting Firebase Authentication users:",
        error
      );


      throw new HttpsError(
        "internal",
        `Failed deleting Firebase Authentication users. ${error.message}`
      );
    }


    // ==================================================
    // FINAL RESULT
    // ==================================================

    console.log(
      "======================================"
    );

    console.log(
      "SKYRENT RESET COMPLETED"
    );

    console.log(
      result
    );

    console.log(
      "======================================"
    );


    return {

      success: true,

      message:
        "SkyRent registered data was successfully reset.",

      ...result

    };

  }
);
