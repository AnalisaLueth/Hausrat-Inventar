# Hausrat-Inventar

Mobile-first Web-App zur Dokumentation des Hausrats für die Versicherung: Fotos, Neuwert,
Zeitwert-Berechnung, Kundendaten/Versicherungsdaten, Archiv und Excel-Export.

## Setup (Firebase verbinden)

Die App nutzt [Firebase](https://console.firebase.google.com) für Login und Datenbank
(Firestore, inkl. Offline-Sync) — bleibt komplett im kostenlosen Spark-Tarif, kein
Blaze-Upgrade/Kreditkarte nötig. Fotos werden client-seitig komprimiert und direkt als
Base64 im jeweiligen Item-Dokument gespeichert (kein separater Storage-Dienst).

1. Firebase-Projekt anlegen, Web-App registrieren, `firebaseConfig` kopieren.
2. In `index.html` den Block `const firebaseConfig = { ... }` durch die echten Werte ersetzen.
3. Unter **Authentication** → Sign-in method → **E-Mail/Passwort** aktivieren.
4. **Firestore Database** im Firebase-Dashboard anlegen.
5. Die Security Rules aus `firebase/firestore.rules` im Dashboard-Bereich "Regeln"
   einfügen und veröffentlichen.

Deployment läuft weiterhin automatisch über Vercel bei jedem Push nach `main`.