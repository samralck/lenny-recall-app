import { firebaseConfig } from "./firebase-config.js";

let api = null;
let initPromise = null;

export async function initFirebase() {
  if (api) return api;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const appMod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const authMod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
    const fsMod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

    const app = appMod.initializeApp(firebaseConfig);
    const auth = authMod.getAuth(app);
    try {
      await authMod.setPersistence(auth, authMod.browserLocalPersistence);
    } catch (error) {
      console.warn("Auth persistence could not be set", error);
    }
    const db = fsMod.getFirestore(app);
    try {
      await fsMod.enableIndexedDbPersistence(db);
    } catch (error) {
      console.warn("Firestore offline persistence not enabled", error.code || error.message);
    }
    api = { app, auth, db, authMod, fsMod };
    return api;
  })();

  return initPromise;
}

export async function signIn(email, password) {
  const { auth, authMod } = await initFirebase();
  return authMod.signInWithEmailAndPassword(auth, email, password);
}

export async function createAccount(email, password) {
  const { auth, authMod } = await initFirebase();
  return authMod.createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  const { auth, authMod } = await initFirebase();
  return authMod.signOut(auth);
}

export async function onUserChanged(callback) {
  const { auth, authMod } = await initFirebase();
  return authMod.onAuthStateChanged(auth, callback);
}

export async function loadCloudState(uid) {
  const { db, fsMod } = await initFirebase();
  const ref = fsMod.doc(db, "users", uid, "apps", "lenny-recall");
  const snap = await fsMod.getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveCloudState(uid, state) {
  const { db, fsMod } = await initFirebase();
  const ref = fsMod.doc(db, "users", uid, "apps", "lenny-recall");
  const cloudState = {
    ...state,
    updatedAt: fsMod.serverTimestamp()
  };
  await fsMod.setDoc(ref, cloudState, { merge: true });
}

export async function subscribeCloudState(uid, callback, onError) {
  const { db, fsMod } = await initFirebase();
  const ref = fsMod.doc(db, "users", uid, "apps", "lenny-recall");
  return fsMod.onSnapshot(ref, snap => {
    if (snap.exists()) callback(snap.data());
  }, onError);
}
