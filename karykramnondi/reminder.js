const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

async function sendReminders(){
  const now = new Date();
  const current = now.toISOString().slice(0,16).replace("T"," ");

  const snap = await db.collection("reminders")
    .where("time","==", current)
    .get();

  if(snap.empty){
    console.log("No reminders now");
    return;
  }

  snap.forEach(async doc=>{
    const data = doc.data();

    await messaging.send({
      token: data.token,
      notification:{
        title: data.title,
        body: data.body
      }
    });

    await doc.ref.delete();
    console.log("Sent reminder");
  });
}

sendReminders();
