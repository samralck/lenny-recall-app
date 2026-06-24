# Lenny Recall App — Complete Setup Guide

This guide assumes you are a beginner. Follow the steps in order. Do not skip the Firebase rules step.

You are setting up a free static app:

1. GitHub Pages hosts the app.
2. Firebase Authentication lets you sign in.
3. Firestore stores Lenny's progress in the cloud.
4. localStorage saves immediately on the device as a fallback.

Your Firebase config has already been inserted into `js/firebase-config.js`.

---

## Part 0 — What you need before starting

You need:

- A computer, not just a phone.
- A Google account for Firebase.
- A GitHub account.
- The project folder from this zip.

You do **not** need:

- A paid GitHub account.
- A paid Firebase account.
- A domain name.
- Node.js.
- A terminal.
- A credit card.

---

## Part 1 — Unzip the project

1. Download the zip file from ChatGPT.
2. Find it in your Downloads folder.
3. Right-click it and choose **Extract All** / **Unzip**.
4. You should now have a folder called:

```text
lenny-recall-cross-device
```

Inside it you should see:

```text
index.html
manifest.webmanifest
service-worker.js
README.md
SETUP_GUIDE.md
css
js
assets
firebase
scripts
```

Do not upload the zip file itself to GitHub. You upload the files and folders inside it.

---

## Part 2 — Check the Firebase config file

Your Firebase details are already inserted.

1. Open the project folder.
2. Open:

```text
js/firebase-config.js
```

3. Confirm it says:

```js
export const firebaseConfig = {
  apiKey: "AIzaSyC9d92RceFiW1C7YnirORU9ECsC4As7Tv4",
  authDomain: "lennys-training.firebaseapp.com",
  projectId: "lennys-training",
  storageBucket: "lennys-training.firebasestorage.app",
  messagingSenderId: "841079792496",
  appId: "1:841079792496:web:d6946153382ddbaf1625b5",
  measurementId: "G-ZSNLHV2RFY"
};
```

4. Close the file. You do not need to edit it.

---

## Part 3 — Set up Firebase Authentication

You only need to do this once.

1. Go to the Firebase Console.
2. Open your project:

```text
lennys-training
```

3. In the left menu, click **Authentication**.
4. Click **Get started** if Firebase asks.
5. Click the **Sign-in method** tab.
6. Find **Email/Password**.
7. Click it.
8. Turn on **Email/Password**.
9. Leave **Email link (passwordless sign-in)** off.
10. Click **Save**.

Why: this lets the app create an account and sign in with an email and password.

---

## Part 4 — Set up Firestore Database

This is where Lenny's progress syncs.

1. In Firebase Console, open your project.
2. In the left menu, click **Firestore Database**.
3. Click **Create database**.
4. Choose **Production mode**.
5. Click **Next**.
6. Choose a location/region. Pick the closest available option to Australia if offered. The app data is tiny, so this choice is not critical.
7. Click **Enable** or **Create**.

Do not use Realtime Database. Use **Firestore Database**.

---

## Part 5 — Add the Firestore security rules

This is the most important security step.

1. In Firebase Console, go to **Firestore Database**.
2. Click the **Rules** tab.
3. Delete everything currently in the rules editor.
4. Open this file from the project folder:

```text
firebase/firestore.rules
```

5. Copy the whole file.
6. Paste it into the Firebase Rules editor.
7. It should look exactly like this:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/apps/lenny-recall {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

8. Click **Publish**.

What this means: a signed-in user can only read and write their own Lenny Recall progress document.

---

## Part 6 — Create a GitHub repository

1. Go to GitHub.
2. Sign in.
3. Click the **+** button near the top right.
4. Choose **New repository**.
5. Repository name:

```text
lenny-recall-app
```

6. Choose **Public**.

For a free GitHub Pages setup, public is the simplest option. The app code may be visible, but Lenny's progress data is protected by Firebase sign-in and Firestore rules.

7. Do **not** tick “Add a README”. This project already has one.
8. Click **Create repository**.

---

## Part 7 — Upload the app files to GitHub

After creating the repository, GitHub will show a mostly empty page.

1. Click **uploading an existing file**.
2. Open your unzipped project folder on your computer.
3. Select everything inside the folder:

```text
index.html
manifest.webmanifest
service-worker.js
README.md
SETUP_GUIDE.md
assets
css
firebase
js
scripts
```

4. Drag all selected files/folders into the GitHub upload box.
5. Wait until GitHub finishes uploading.
6. Scroll down to **Commit changes**.
7. In the message box, write:

```text
Initial Lenny Recall app
```

8. Click **Commit changes**.

Important: make sure `index.html` is at the top level of the repository. It should not be inside another folder.

Correct:

```text
lenny-recall-app/index.html
```

Incorrect:

```text
lenny-recall-app/lenny-recall-cross-device/index.html
```

---

## Part 8 — Turn on GitHub Pages

1. Open your GitHub repository.
2. Click **Settings**.
3. In the left menu, click **Pages**.
4. Under **Build and deployment**, find **Source**.
5. Choose:

```text
Deploy from a branch
```

6. Under **Branch**, choose:

```text
main
```

7. Under folder, choose:

```text
/root
```

8. Click **Save**.

Wait 1–3 minutes. GitHub will show a site address like:

```text
https://YOUR-GITHUB-USERNAME.github.io/lenny-recall-app/
```

Copy that address.

---

## Part 9 — Add the GitHub Pages domain to Firebase

This step lets Firebase Authentication accept sign-ins from your GitHub Pages app.

1. Go back to Firebase Console.
2. Open your project:

```text
lennys-training
```

3. Click **Authentication**.
4. Click **Settings**.
5. Find **Authorised domains**.
6. Click **Add domain**.
7. Add only your GitHub Pages domain, not the full app URL.

Use this format:

```text
YOUR-GITHUB-USERNAME.github.io
```

Do not include:

```text
https://
```

Do not include:

```text
/lenny-recall-app/
```

8. Save.

Example:

```text
samteacher.github.io
```

---

## Part 10 — Test the app on your computer

1. Open your GitHub Pages app URL in a browser.
2. You should see **Lenny Recall**.
3. Go to the **Plan** tab.
4. In the Sync section, enter an email and password.
5. Click **Create account**.
6. Go to **Today**.
7. Log a few counts or successes.
8. Refresh the page.
9. Confirm your progress remains.
10. Open the app in another browser or on another device.
11. Go to **Plan**.
12. Sign in with the same email/password.
13. Confirm the same progress appears.

If this works, cross-device syncing is working.

---

## Part 11 — Install it on your iPhone

Use Safari, not Chrome, for this step.

1. On your iPhone, open Safari.
2. Go to your GitHub Pages URL:

```text
https://YOUR-GITHUB-USERNAME.github.io/lenny-recall-app/
```

3. Tap the **Share** button.
4. Scroll and tap **Add to Home Screen**.
5. Name it:

```text
Lenny Recall
```

6. Tap **Add**.
7. Open the app from the new Home Screen icon.
8. Go to **Plan**.
9. Sign in with the same email/password.

From now on, use the Home Screen icon at the park.

---

## Part 12 — How to use the app day to day

On training days:

1. Open the app.
2. Use **Today**.
3. Tap **Field mode** for the mini-session you are doing.
4. Tap **+ Success** when the rep works.
5. Tap **+ Miss** if the rep fails.
6. If you get two misses, make the setup easier.
7. At the end of the day, use the Advance/Repeat panel.
8. Do not advance just because the app lets you. Use the 80% rule and your judgement.

---

## Part 13 — Backups

Even with cloud sync, use backups occasionally.

1. Go to **Plan**.
2. Tap **Export backup**.
3. Save the JSON file somewhere safe, such as iCloud Drive.

Use **Restore backup** if something goes wrong.

---

## Troubleshooting

### The app shows a blank page

Check that `index.html` is at the top level of the GitHub repo. Also wait a few minutes after enabling Pages.

### Sign-in fails

Check these things:

1. Email/Password is enabled in Firebase Authentication.
2. Your GitHub Pages domain is added to Firebase Authorised domains.
3. You used the domain only, not the full URL.
4. Firestore rules have been published.

### Progress saves on one device but does not appear on another

Check that both devices are signed into the same account in the Plan tab. Also check that Firestore Database exists and the rules were published.

### It says Local only

This means Firebase was not available or you are not signed in. The app still saves to the device. Sign in from the Plan tab when online.

### I uploaded the wrong folder

In GitHub, the repository should show `index.html` immediately in the file list. If you see a folder first and `index.html` is inside that folder, GitHub Pages may not load correctly. Re-upload the contents of the folder, not the folder itself.

---

## Do not change these unless you know what you are doing

- `firebase/firestore.rules`
- the Firestore document path in `js/firebase-service.js`
- `js/firebase-config.js`, unless Firebase gives you a new config

---

## Expected final result

When finished, you will have:

- A free public GitHub Pages URL for the app.
- Private progress data protected by Firebase Authentication and Firestore rules.
- Cross-device sync when signed in.
- Local fallback if the app is offline.
- iPhone Home Screen access for park use.
