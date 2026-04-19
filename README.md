# GiaFarm

GiaFarm e' una webapp gestionale agricola pensata per Vercel, Google OAuth, Google Drive come archivio documentale e Gmail come canale di recupero allegati scannerizzati.

La base iniziale consegnata include Next.js App Router, TypeScript, Tailwind CSS, Auth.js con Google, Prisma ORM, schema dati completo per i moduli richiesti, seed demo, layout gestionale con sidebar, dashboard e pagine navigabili.

## Stack scelto

- **Next.js App Router + TypeScript**: compatibile con Vercel, server component e route handler per API interne.
- **Tailwind CSS + componenti locali**: UI sobria, veloce da evolvere, senza dipendenze grafiche pesanti.
- **Auth.js v5 + Google OAuth + Prisma Adapter**: login Google, sessioni persistite a DB, ruoli e whitelist.
- **Prisma + PostgreSQL**: schema robusto, migrazioni controllate, compatibile con Neon, Vercel Postgres o Supabase.
- **googleapis**: base ufficiale per Drive e Gmail, con service account o OAuth dedicato.
- **Zod**: validazione server-side per form e azioni critiche.

## Struttura cartelle

```txt
app/
  (app)/                 # area protetta del gestionale
  (public)/login/        # login Google
  api/auth/              # Auth.js
  api/google/            # route handler Drive/Gmail
components/
  app/                   # layout, sidebar, header, pagine modulo
  ui/                    # button, card, table, detail, form shell
lib/
  auth/                  # guard e permessi
  google/                # client, Drive, Gmail
  validation/            # schemi Zod
  audit.ts               # audit log base
  demo-data.ts           # mock realistici per UI iniziale
prisma/
  schema.prisma          # modello dati iniziale
  seed.ts                # seed demo
docs/
  CHECKLIST_SETUP.md
  MILESTONES.md
```

## Avvio locale

1. Installa dipendenze:

```bash
npm install
```

2. Copia il file ambiente:

```bash
cp .env.example .env
```

3. Configura almeno `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS`.

4. Genera Prisma e crea lo schema:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Avvia:

```bash
npm run dev
```

## Setup infrastruttura GiaFarm

Creare account e progetti dedicati, separati da altri gestionali.

### Vercel

1. Creare un nuovo progetto Vercel dedicato a GiaFarm.
2. Collegare il repository GiaFarm.
3. Impostare framework **Next.js**.
4. Configurare variabili ambiente Production e Preview.
5. Collegare un database PostgreSQL gestito, preferibilmente Neon o Vercel Postgres.
6. Aggiungere il dominio definitivo quando disponibile.

### Database

1. Creare un database PostgreSQL dedicato su Supabase.
2. Creare un utente database dedicato a Prisma, preferibilmente `prisma`, con privilegi sullo schema `public`.
3. Copiare la transaction pooler connection string in `DATABASE_URL`.
4. Copiare la direct connection Supabase in `DIRECT_URL`.
5. Usare SSL in produzione.
6. Eseguire migrazioni Prisma da ambiente controllato.
7. Abilitare backup automatici dal provider.

### Google Cloud

1. Creare nuovo progetto Google Cloud dedicato: `GiaFarm`.
2. Configurare OAuth consent screen.
3. Creare credenziali OAuth Web Application.
4. Aggiungere redirect URI locali:
   - `http://localhost:3000/api/auth/callback/google`
5. Aggiungere redirect URI produzione:
   - `https://dominio-giafarm.it/api/auth/callback/google`
6. Abilitare API:
   - Google Drive API
   - Gmail API
7. Creare cartella Google Drive root dedicata all'archivio GiaFarm.
8. Salvare l'id cartella in `GOOGLE_DRIVE_ROOT_FOLDER_ID`.

### Gmail scanner dedicata

1. Creare una casella dedicata per scansioni, ad esempio `scansioni@azienda.it`.
2. Configurare scanner/multifunzione per inviare PDF o immagini a quella casella.
3. Applicare una label Gmail dedicata, opzionale, ad esempio `GiaFarm`.
4. Salvare la casella in `GOOGLE_SCANNER_EMAIL`.
5. Salvare la label in `GOOGLE_GMAIL_SCANNER_LABEL`.

### Service account Google

Opzione consigliata per ambiente aziendale Google Workspace:

1. Creare service account nel progetto Google Cloud.
2. Abilitare domain-wide delegation.
3. Autorizzare gli scope Drive/Gmail necessari nella console Admin Workspace.
4. Condividere la cartella Drive GiaFarm con il service account.
5. Configurare:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

Per account Google consumer non Workspace, usare OAuth utente dedicato come fase successiva: la struttura `lib/google` e' gia' isolata per sostituire la strategia di autenticazione.

## Configurazione ambiente reale

GiaFarm usa Supabase come PostgreSQL gestito tramite Prisma. Le chiavi Supabase pubbliche `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sono previste in `.env.example` per future integrazioni client, ma Prisma non le usa per collegarsi al database.

Variabili obbligatorie per avvio, build e deploy:

- `DATABASE_URL`: connection string runtime Prisma. Su Vercel usare Supavisor transaction pooler, porta `6543`, con `pgbouncer=true`.
- `DIRECT_URL`: connection string per Prisma CLI e migrazioni. Usare la direct connection Supabase `db.PROJECT_REF.supabase.co:5432`.
- `AUTH_SECRET`: segreto Auth.js generato con valore casuale forte.
- `AUTH_GOOGLE_ID`: Client ID OAuth Google Web Application.
- `AUTH_GOOGLE_SECRET`: Client Secret OAuth Google Web Application.
- `ADMIN_EMAILS`: elenco email admin separate da virgola, senza parentesi, ad esempio `admin@example.com,altro@example.com`.

Variabili Google Drive/Gmail da compilare quando si attiva l'import documentale:

- `GOOGLE_DRIVE_ROOT_FOLDER_ID`: id cartella root Drive GiaFarm.
- `GOOGLE_SCANNER_EMAIL`: casella dedicata che riceve scansioni.
- `GOOGLE_GMAIL_SCANNER_LABEL`: label Gmail da leggere, default `INBOX`.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: email service account, se si usa Google Workspace con domain-wide delegation.
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: private key service account con newline escapati come `\n`.

Redirect URI da configurare in Google Cloud OAuth:

- Locale: `http://localhost:3000/api/auth/callback/google`
- Produzione Vercel: `https://gia-farm.vercel.app/api/auth/callback/google`
- Preview Vercel, se abilitate: aggiungere gli URL preview necessari oppure disattivare login sulle preview.

Dominio produzione corretto:

- `https://gia-farm.vercel.app`

Il dominio `https://giafarm.vercel.app` senza trattino non appartiene a questo deploy e puo' mostrare `DEPLOYMENT_NOT_FOUND`.

Note Supabase/Prisma:

- In serverless e' consigliato usare il pooler transaction per `DATABASE_URL`.
- `DIRECT_URL` serve per migrazioni, introspezione e comandi Prisma CLI.
- Se il pooler transaction genera errori di prepared statement, verificare che `DATABASE_URL` includa `pgbouncer=true`.
- Non salvare password database, Google secret o service account key nel repository.
- Se un secret e' stato condiviso in chat o in un canale non sicuro, rigenerarlo prima della produzione.

## Autenticazione e ruoli

- Login via Google.
- Accesso consentito solo a email in tabella `AuthorizedEmail` o in `ADMIN_EMAILS`.
- Ruoli iniziali: `ADMIN`, `USER`.
- `/impostazioni` richiede ruolo `ADMIN`.
- Le rettifiche magazzino e configurazioni critiche devono usare `requireRole(RoleCode.ADMIN)` lato server.

## Schema dati iniziale

Lo schema Prisma copre:

- utenti, ruoli, whitelist email
- campi, PAC storicizzata per anno, coordinate e poligoni custom
- campagne agricole novembre/ottobre
- colture, gruppi campi, membership per campagna
- lavorazioni con categorie: semina, raccolta, preparazione, trattamento, irrigazione, altro
- allegati operazioni e file Drive
- bolle in ingresso, DDT in uscita, righe documento
- materiali/prodotti e documenti tecnici
- movimenti magazzino, rettifiche admin e audit log
- costi, ricavi e allocazioni economiche
- eventi calendario di sistema e manuali
- sessioni import Gmail

## Modulo Campi

Il modulo Campi usa dati reali da Prisma/Supabase.

- `Field`: anagrafica stabile del terreno, con comune, foglio, mappale, alias, superficie catastale in mq e note.
- `FieldUsageHistory`: storico annuale della superficie utilizzata in mq.
- `FieldPacHistory`: storico annuale dello stato PAC; `null` indica valore non ancora definito.
- `AuditLog`: registra creazione/modifica dei valori storici con utente, valore precedente e valore nuovo.

Il seed importa i campi iniziali in modo idempotente usando la chiave `comune + foglio + mappale`. Per ogni campo crea o aggiorna la riga di superficie utilizzata 2026 e crea una riga PAC 2026 con valore non definito. I vecchi campi demo del bootstrap vengono nascosti con soft delete, senza cancellare relazioni storiche.

L'eliminazione campi non e' ancora esposta in UI: andra' implementata come soft delete.

## Modulo Lavorazioni

Il modulo Lavorazioni usa dati reali da Prisma/Supabase.

- `Campaign`: campagna agricola novembre/ottobre, ad esempio `Campagna 2025/26`, con stato `ACTIVE`.
- `Crop`: anagrafica colture.
- `FieldGroup`: gruppo annuale/ciclo colturale collegato a campagna e coltura, con periodo opzionale `startsOn`/`endsOn`.
- `FieldGroupMembership`: campi assegnati al gruppo. Uno stesso campo puo' appartenere a piu' gruppi nella stessa campagna se i cicli sono distinti, ad esempio frumento autunnale e soia estiva.
- `OperationType`: codifiche delle tipologie operative, divise in semina, raccolta, preparazione terreno, trattamenti, irrigazione e altro.
- `Operation`: lavorazione reale con data, campagna, gruppo/campi, prodotto, quantita', superficie, motivo e note.
- `OperationAttachment` + `DriveFile`: allegati PDF collegati a lavorazioni tramite metadati/link Drive.

Il seed rimuove le vecchie lavorazioni demo create durante il bootstrap iniziale e mantiene solo le codifiche utili. Non crea nuove lavorazioni fittizie.

## Mappa campi

MVP previsto:

1. Campo con coordinate `latitude`/`longitude`.
2. Campo con `geoPolygon` JSON disegnabile manualmente in futuro.
3. Note geografiche libere.

Opzioni:

- **Mappa generica**: OpenStreetMap/Leaflet o Google Maps con marker e poligoni custom. E' la strada consigliata per MVP.
- **Integrazione catastale ufficiale**: da trattare come fase successiva. Il recupero automatico affidabile della mappa catastale del comune di Cornate d'Adda non e' un prerequisito del MVP.

## Integrazioni Google

- `lib/google/drive.ts`: lista file e registrazione metadati Drive in DB.
- `lib/google/gmail.ts`: lista email con allegati e creazione bozze import.
- `app/api/google/drive`: endpoint protetto per test connessione Drive.
- `app/api/google/gmail`: endpoint protetto per test lettura Gmail.

Gli endpoint restituiscono errore controllato se mancano credenziali. Questa scelta evita falsi positivi durante il setup.

## Qualita' e sicurezza

- Controllo accessi lato middleware e lato server.
- Sessioni persistite su DB.
- Whitelist email per accesso iniziale.
- Audit log predisposto per azioni sensibili.
- Validazione Zod pronta per rettifiche magazzino.
- Prisma come singola fonte per relazioni e vincoli.

## Comandi utili

```bash
npm run dev
npm run build
npm run typecheck
npm run db:generate
npm run db:push
npm run db:seed
```

## Note operative

- Sostituire `admin@giafarm.local` nel seed con email reale o usare `ADMIN_EMAILS`.
- In produzione non usare `db:push`: creare migrazioni Prisma.
- Il parsing OCR non e' incluso nella milestone 1; il modello `GmailImportSession` e `DriveFile` lo rendono aggiungibile in seguito.
- La UI usa mock realistici finche' i server action dei singoli moduli non saranno collegati al DB.
