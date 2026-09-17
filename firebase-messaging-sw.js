importScripts(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);


/* =========================================================
   FIREBASE CONFIG
========================================================= */

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


const messaging =
    firebase.messaging();


/* =========================================================
   BACKGROUND NOTIFICATION
========================================================= */

messaging.onBackgroundMessage(
    function(payload){

        console.log(
            "Background notification:",
            payload
        );


        const notification =
            payload.notification || {};


        const title =
            notification.title ||
            "SkyRent Admin";


        const body =
            notification.body ||
            "You have a new SkyRent notification.";


        const notificationData =
            payload.data || {};


        let targetUrl =
            notificationData.url ||
            "https://skyrent.uk/admin.html";


        self.registration.showNotification(
            title,
            {
                body: body,

                icon:
                    "https://skyrent.uk/skyrent.png",

                badge:
                    "https://skyrent.uk/skyrent.png",

                data:{
                    url: targetUrl
                }
            }
        );

    }
);


/* =========================================================
   NOTIFICATION CLICK
========================================================= */

self.addEventListener(
    "notificationclick",
    function(event){

        event.notification.close();


        const targetUrl =
            event.notification &&
            event.notification.data &&
            event.notification.data.url
                ? event.notification.data.url
                : "https://skyrent.uk/admin.html";


        event.waitUntil(

            clients.matchAll({
                type:"window",
                includeUncontrolled:true
            })
            .then(function(clientList){

                for(
                    const client of clientList
                ){

                    if(
                        "focus" in client
                    ){

                        client.navigate(
                            targetUrl
                        );

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

            })

        );

    }
);
