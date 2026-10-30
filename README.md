# Ημερολόγιο Καυσίμων — εφαρμογή Android

Καταγραφή ανεφοδιασμών από φωτογραφίες κοντέρ, αντλίας και απόδειξης, με κατανάλωση, πολλά αυτοκίνητα και υπενθύμιση service.
Η ανάγνωση των φωτογραφιών γίνεται με το δωρεάν πακέτο του Google Gemini.

## Τι υπάρχει μέσα

| Αρχείο / φάκελος | Τι είναι |
|---|---|
| `www/index.html` | Όλη η εφαρμογή (εμφάνιση και λογική) |
| `capacitor.config.json` | Όνομα και αναγνωριστικό της εφαρμογής |
| `package.json` | Τα εργαλεία που χρειάζονται για να γίνει app Android |
| `assets/` | Εικονίδιο και οθόνη εκκίνησης |
| `.github/workflows/android.yml` | Οδηγίες για να χτίζεται το APK online στο GitHub |

## Ανάγνωση φωτογραφιών χωρίς κλειδί στον χρήστη (μία φορά)

Ο φάκελος `worker/` είναι ένας μικρός μεσάζοντας που ανεβαίνει δωρεάν στο Cloudflare και κρατάει το κλειδί Gemini κρυφό.
Ρυθμίζεται μία φορά, με τρία «μυστικά» στο GitHub (Settings → Secrets and variables → Actions → New repository secret):

| Όνομα μυστικού | Από πού |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey → Create API key |
| `CLOUDFLARE_ACCOUNT_ID` | dash.cloudflare.com → Workers & Pages → δεξιά «Account ID» |
| `CLOUDFLARE_API_TOKEN` | dash.cloudflare.com → My Profile → API Tokens → Create Token → «Edit Cloudflare Workers» |

Μετά: Actions → Build Android APK → Run workflow. Το νέο APK διαβάζει φωτογραφίες χωρίς κλειδί.
Χωρίς τα μυστικά, το APK χτίζεται κανονικά και ζητάει δικό του κλειδί από το γρανάζι.

## Τρόπος Α: χτίσιμο online στο GitHub (χωρίς εγκαταστάσεις)

1. Φτιάξε δωρεάν λογαριασμό στο https://github.com.
2. Πάτα **New repository**, δώσε όνομα `kafsima`, άφησέ το **Private** και πάτα **Create repository**.
3. Στη σελίδα που ανοίγει πάτα **uploading an existing file**.
4. Σύρε μέσα **όλο το περιεχόμενο** του φακέλου `kafsima-app` (τους φακέλους `www`, `assets`, `.github` και τα αρχεία). Πάτα **Commit changes**.
5. Πήγαινε στην καρτέλα **Actions**. Θα τρέχει το «Build Android APK» (περίπου 5–8 λεπτά).
6. Όταν πρασινίσει, άνοιξέ το και κατέβασε το **kafsima-apk** από το κάτω μέρος. Μέσα είναι το `app-debug.apk`.

## Τρόπος Β: χτίσιμο στον υπολογιστή (Windows)

1. Εγκατέστησε το **Node.js LTS** (https://nodejs.org) και το **Android Studio** (https://developer.android.com/studio).
2. Άνοιξε το **Command Prompt** μέσα στον φάκελο `kafsima-app` και γράψε:
   ```
   npm install
   npx cap add android
   npx capacitor-assets generate --android
   npx cap sync android
   npx cap open android
   ```
3. Στο Android Studio περίμενε να τελειώσει το «Gradle sync» και πάτα **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.

## Εγκατάσταση στο κινητό

1. Στείλε το `app-debug.apk` στο κινητό (email, Google Drive ή καλώδιο).
2. Άνοιξέ το. Το Android θα ζητήσει να επιτρέψεις εγκατάσταση από «άγνωστη πηγή». Επίτρεψέ το για εκείνη την εφαρμογή.
3. Άνοιξε το **Καύσιμα**, πάτα το γρανάζι και βάλε το δωρεάν κλειδί Gemini από https://aistudio.google.com/apikey.
4. Για να περάσεις τα παλιά δεδομένα: γρανάζι → **Επαναφορά από αντίγραφο** → διάλεξε το αρχείο `.json`.

## Όταν αλλάζει κάτι

Αντικαθιστάς το `www/index.html` στο GitHub (Add file → Upload files) και χτίζεται αυτόματα νέο APK.

## Για το Google Play (επόμενο βήμα)

- Λογαριασμός Google Play Console (25$ εφάπαξ).
- Υπογεγραμμένο αρχείο `.aab` αντί για `app-debug.apk`.
- Σελίδα πολιτικής απορρήτου, γιατί οι φωτογραφίες στέλνονται στο Gemini.
- Το `appId` στο `capacitor.config.json` (`com.kafsimalog.app`) πρέπει να είναι μοναδικό και δεν αλλάζει μετά τη δημοσίευση.
