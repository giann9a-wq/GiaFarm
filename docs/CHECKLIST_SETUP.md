# Checklist Setup Account E Credenziali

## Account dedicati

- [ ] Account/progetto Vercel GiaFarm creato.
- [ ] Database PostgreSQL dedicato creato.
- [ ] Progetto Google Cloud GiaFarm creato.
- [ ] OAuth consent screen configurato.
- [ ] OAuth Web Client creato.
- [ ] Gmail scanner dedicata creata o individuata.
- [ ] Cartella Google Drive root GiaFarm creata.
- [ ] Service account creato, se disponibile Google Workspace.

## Variabili ambiente

- [ ] `DATABASE_URL`
- [ ] `AUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `APP_BASE_URL`
- [ ] `AUTH_GOOGLE_ID`
- [ ] `AUTH_GOOGLE_SECRET`
- [ ] `ADMIN_EMAILS`
- [ ] `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- [ ] `GOOGLE_SCANNER_EMAIL`
- [ ] `GOOGLE_GMAIL_SCANNER_LABEL`
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- [ ] `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

## Google Cloud

- [ ] Drive API abilitata.
- [ ] Gmail API abilitata.
- [ ] Redirect URI locale inserito.
- [ ] Redirect URI produzione inserito.
- [ ] Cartella Drive condivisa con service account.
- [ ] Scope domain-wide delegation approvati, se Workspace.

## Deploy Vercel

- [ ] Repository collegato.
- [ ] Variabili ambiente Production impostate.
- [ ] Variabili ambiente Preview impostate.
- [ ] Build command verificato.
- [ ] Primo deploy eseguito.
- [ ] Migrazioni DB eseguite.
- [ ] Seed admin o whitelist email applicata.

## Validazioni iniziali

- [ ] Login Google con admin reale.
- [ ] Utente non whitelist respinto.
- [ ] Dashboard accessibile.
- [ ] `/impostazioni` accessibile solo ad admin.
- [ ] `/api/google/drive` risponde correttamente dopo credenziali.
- [ ] `/api/google/gmail` risponde correttamente dopo credenziali.
