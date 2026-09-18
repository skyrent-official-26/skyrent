const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore
} = require("firebase-admin/firestore");
const {
  getAuth
} = require("firebase-admin/auth");

initializeApp();

const db = getFirestore();
const auth = getAuth();

const ADMIN_UID = "28zzG9NB46gRkwia7WtOxS1lQNa2";

const COLLECTIONS_TO_RESET = [
  "deposits",
  "withdrawals",
  "investments",
  "purchases",
  "earnings",
  "transactions",
  "referrals"
];

exports.resetSkyRentData = onCall(
  {
    region: "asia-southeast1",
    timeoutSeconds: 540,
    memory: "512MiB"
  },
  async (request) => {

    console.log("RESET FUNCTION STARTED");

    // ==============================
    // ADMIN SECURITY CHECK
    // ==============================

    if (!request.auth) {
      console.error("No authenticated user");
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in as administrator."
      );
    }

    console.log("Caller UID:", request.auth.uid);

    if (request.auth.uid !== ADMIN_UID) {
      console.error("Unauthorized UID:", request.auth.uid);

      throw new HttpsError(
        "permission-denied",
        "Only the SkyRent administrator can perform this reset."
      );
    }

    // ==============================
    // CONFIRMATION CHECK
    // ==============================

    if (
      !request.data ||
      request.data.confirm !== "RESET_SKYRENT_DATA"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Reset confirmation was not provided."
      );
    }

    const result = {
      firestore: {},
      authUsersDeleted: 0
    };

    // ==============================
    // DELETE FIRESTORE COLLECTIONS
    // ==============================

    for (const collectionName of COLLECTIONS_TO_RESET) {

      console.log(
        "Deleting collection:",
        collectionName
      );

      try {

        const documentRefs =
          await db
            .collection(collectionName)
            .listDocuments();

        let deleted = 0;

        for (const docRef of documentRefs) {

          await db.recursiveDelete(docRef);

          deleted++;

        }

        result.firestore[collectionName] = deleted;

        console.log(
          `Deleted ${deleted} documents from ${collectionName}`
        );

      } catch (error) {

        console.error(
          `Error deleting ${collectionName}:`,
          error
        );

        throw new HttpsError(
          "internal",
          `Failed deleting ${collectionName}: ${error.message}`
        );
      }
    }

    // ==============================
    // DELETE USER DOCUMENTS
    // EXCEPT ADMIN
    // ==============================

    console.log("Deleting user documents");

    try {

      const userRefs =
        await db
          .collection("users")
          .listDocuments();

      let deletedUsers = 0;

      for (const userRef of userRefs) {

        // NEVER delete administrator
        if (userRef.id === ADMIN_UID) {
          console.log(
            "Preserving admin user document"
          );
          continue;
        }

        await db.recursiveDelete(userRef);

        deletedUsers++;
      }

      result.firestore.users = deletedUsers;

      console.log(
        `Deleted ${deletedUsers} user documents`
      );

    } catch (error) {

      console.error(
        "Error deleting users:",
        error
      );

      throw new HttpsError(
        "internal",
        `Failed deleting user documents: ${error.message}`
      );
    }

    // ==============================
    // GET ALL AUTH USERS
    // ==============================

    console.log("Getting Firebase Authentication users");

    try {

      const authUsers = [];

      let pageToken;

      do {

        const page =
          await auth.listUsers(
            1000,
            pageToken
          );

        for (const user of page.users) {

          // NEVER DELETE ADMIN ACCOUNT
          if (user.uid !== ADMIN_UID) {
            authUsers.push(user.uid);
          }

        }

        pageToken = page.pageToken;

      } while (pageToken);

      console.log(
        `Found ${authUsers.length} authentication users to delete`
      );

      // ==============================
      // DELETE AUTH USERS IN BATCHES
      // ==============================

      for (
        let i = 0;
        i < authUsers.length;
        i += 1000
      ) {

        const batch =
          authUsers.slice(i, i + 1000);

        if (batch.length > 0) {

          const deleteResult =
            await auth.deleteUsers(batch);

          result.authUsersDeleted +=
            deleteResult.successCount;

          console.log(
            `Deleted ${deleteResult.successCount} Auth users`
          );

          if (
            deleteResult.failureCount > 0
          ) {

            console.error(
              "Some Auth users could not be deleted:",
              deleteResult.errors
            );
          }
        }
      }

    } catch (error) {

      console.error(
        "Error deleting Auth users:",
        error
      );

      throw new HttpsError(
        "internal",
        `Failed deleting Firebase Authentication users: ${error.message}`
      );
    }

    // ==============================
    // FINISHED
    // ==============================

    console.log(
      "SKYRENT RESET COMPLETED",
      result
    );

    return {
      success: true,
      message: "SkyRent registered data has been reset.",
      ...result
    };
  }
);
