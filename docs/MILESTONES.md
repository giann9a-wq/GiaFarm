# Piano Di Sviluppo Per Milestone

## Milestone 1

Obiettivi:
- Setup progetto, autenticazione Google, layout generale.
- Ruoli base `ADMIN` e `USER`.
- Homepage iniziale, anagrafiche base, schema DB iniziale, seed demo.

Entita':
- `User`, `Role`, `AuthorizedEmail`, `Campaign`, `Field`, `FieldPacHistory`, `Crop`, `FieldGroup`, `OperationType`, `ProductMaterial`, `AuditLog`.

Pagine:
- Home, login, Campi, Lavorazioni, Bolle/DDT, Magazzino, Schede Prodotti, Finanza, Calendario, Impostazioni.

API / azioni server:
- Auth.js route.
- Guard server-side.
- Endpoint test Drive/Gmail.

Test minimi:
- Login admin.
- Blocco email non autorizzata.
- Navigazione area protetta.
- `prisma generate`, `db:push`, `db:seed`, `build`.

## Milestone 2

Obiettivi:
- Modulo Campi completo.
- Campagne agricole novembre/ottobre.
- Gruppi campi per campagna.
- Base Lavorazioni con allegati documentali.

Entita':
- `Field`, `FieldPacHistory`, `Campaign`, `Crop`, `FieldGroup`, `FieldGroupMembership`, `Operation`, `OperationAttachment`, `DriveFile`.

Pagine:
- Elenco campi, dettaglio campo, form campo.
- Elenco campagne, dettaglio gruppo, form lavorazione.
- Vista mappa MVP con marker/poligoni manuali.

API / azioni server:
- CRUD campi.
- CRUD PAC history.
- CRUD gruppi campi.
- CRUD lavorazioni.
- Collegamento Drive file a lavorazione.

Test minimi:
- PAC cambia per anno senza perdere storico.
- Gruppo campi diverso per campagna.
- Operazione collegata a campo o gruppo.
- Allegato Drive registrato nel DB.

## Milestone 3

Obiettivi:
- Bolle in ingresso.
- Import Gmail.
- Storage Drive.
- DDT in uscita con esportazione PDF.

Entita':
- `InboundDeliveryNote`, `InboundDeliveryRow`, `Supplier`, `GmailImportSession`, `DriveFile`, `OutboundDdt`, `OutboundDdtRow`, `Customer`.

Pagine:
- Inbox scanner.
- Bozza import bolla.
- Archivio bolle.
- Creazione DDT.
- Anteprima/stampa DDT.

API / azioni server:
- Lettura Gmail con allegati.
- Import allegato su Drive.
- Creazione bozza bolla.
- Numerazione DDT.
- Generazione PDF DDT.

Test minimi:
- Email con PDF appare in lista.
- Import crea `DriveFile` e bozza bolla.
- DDT riceve numero univoco.
- PDF stampabile con dati corretti.

## Milestone 4

Obiettivi:
- Magazzino consultabile.
- Schede prodotti.
- Rettifiche admin.
- Audit log pieno.

Entita':
- `ProductMaterial`, `WarehouseMovement`, `WarehouseAdjustment`, `ProductDocument`, `AuditLog`.

Pagine:
- Giacenze.
- Dettaglio prodotto/materiale.
- Movimenti magazzino.
- Rettifica admin.
- Archivio schede sicurezza.

API / azioni server:
- Calcolo giacenze.
- Rettifica con nota obbligatoria.
- Collegamento scheda sicurezza a prodotto.
- Audit automatico azioni sensibili.

Test minimi:
- Giacenza = ingressi - uscite + rettifiche.
- User non puo' rettificare.
- Admin rettifica solo con nota.
- Audit creato per rettifica.

## Milestone 5

Obiettivi:
- Finanza.
- Dashboard economica.
- Calendario integrato.

Entita':
- `FinanceCost`, `FinanceRevenue`, `FinanceAllocation`, `CalendarEvent`, `Campaign`, `FieldGroup`.

Pagine:
- Costi.
- Ricavi.
- Dashboard risultati.
- Calendario giorno/settimana/mese.

API / azioni server:
- CRUD costi e ricavi.
- Allocazioni su gruppi campi.
- Aggregazioni dashboard.
- Eventi calendario manuali.
- Eventi generati da lavorazioni.

Test minimi:
- Margine per gruppo = ricavi allocati - costi allocati.
- Filtri periodo/campagna/gruppo coerenti.
- Lavorazione crea evento calendario sistema.
- Evento manuale non viene sovrascritto.
