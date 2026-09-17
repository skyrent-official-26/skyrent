importScripts(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);


/* =====================================================
   FIREBASE CONFIG
===================================================== */

firebase.initializeApp({

    apiKey:
        "AIzaSyDAbHsV-S363u-sGCBo3m1O7YLEaFAa4e8",

    authDomain:
        "skyrent-ea30c.firebaseapp.com",

    projectId:
        "skyrent-ea30c",

    storageBucket:
        "skyrent-ea30c.firebasestorage.app",

    messagingSenderId:
        "572678456448",

    appId:
        "1:572678456448:web:6b7132351515742dd09265"

});


/* =====================================================
   FIREBASE MESSAGING
===================================================== */

const messaging =
    firebase.messaging();


/* =====================================================
   BACKGROUND MESSAGE
===================================================== */

messaging.onBackgroundMessage(
    (payload) => {

        console.log(
            "SkyRent background message:",
            payload
        );


        const data =
            payload.data || {};


        const title =
            data.title ||
            payload.notification?.title ||
            "SkyRent Admin";


        const body =
            data.body ||
            payload.notification?.body ||
            "You have a new SkyRent request.";


        const notificationData = {

            url:
                data.url ||
                "admin.html",

            type:
                data.type ||
                "request",

            requestId:
                data.requestId ||
                ""

        };


        self.registration.showNotification(

            title,

            {

                body:
                    body,

                icon:
                    "./skyrent-logo.png",

                badge:
                    "./skyrent-logo.png",

                tag:
                    (
                        data.type ||
                        "request"
                    ) +
                    "-" +
                    (
                        data.requestId ||
                        Date.now()
                    ),

                renotify:
                    true,

                data:
                    notificationData

            }

        );

    }

);


/* =====================================================
   NOTIFICATION CLICK
===================================================== */

self.addEventListener(
    "notificationclick",
    (event) => {

        event.notification.close();


        const data =
            event.notification.data || {};


        const relativeUrl =
            data.url ||
            "admin.html";


        /*
           Resolve the URL relative to the
           GitHub Pages project folder.
        */

        const targetUrl =
            new URL(
                relativeUrl,
                self.registration.scope
            ).href;


        event.waitUntil(

            clients
                .matchAll({

                    type:
                        "window",

                    includeUncontrolled:
                        true

                })
                .then(
                    (clientList) => {

                        for(
                            const client
                            of clientList
                        ){

                            if(
                                "navigate"
                                in client
                            ){

                                client.navigate(
                                    targetUrl
                                );

                            }


                            if(
                                "focus"
                                in client
                            ){

                                return client.focus();

                            }

                        }


                        if(
                            clients.openWindow
                        ){

                            return clients.openWindow(
                                targetUrl
                            );

                        }

                    }
                )

        );

    }
);
