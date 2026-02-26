# Synergos Volgsysteem – STATUS

## Huidige versie
v1.42

## Live omgeving
Vercel – Production branch: main

## Wat is stabiel
- Student view werkt
- Docent view werkt
- Admin basis werkt
- Role preview alleen zichtbaar via ?preview=1
- Tools pagina bestaat (placeholder met 3 blokken)
- Deploy pipeline stabiel (geen migrations in build)

## Wat is in ontwikkeling
- Admin Unlock tool (eerste echte tool)
- Import functionaliteit (later)

## Belangrijke keuzes
- Migrations NIET automatisch in Vercel build
- UI deploys moeten altijd groen zijn
- Schema wijzigingen bewust handmatig uitvoeren
- directUrl toegevoegd in Prisma voor migrations

## Volgende prioriteiten
1. Unlock tool afronden
2. Admin overzicht verbeteren
3. Imports V1 (studenten eerst)
4. Docent "preview als student" netjes integreren

## Bekende aandachtspunten
- Email duplicatie bij studenten (CRM issue)
- Rollenstructuur moet later via echte auth lopen
- Unlock moet netjes omgaan met TeacherReview status

### v1.41 – Student inleverfunctie

- Assessment heeft veld `submittedAt`
- Student kan meetmoment inleveren via knop
- Na inleveren:
  - sliders disabled
  - saveScore geblokkeerd
  - status toont ingeleverd op datum/tijd
- Admin unlock nog te bouwen

25-02-2026
Vandaag afgerond / werkend

Student → Volgsysteem opgesplitst in wrapper + client component:

/student/volgsysteem heeft nu een “← Terug naar dashboard” link via wrapper (app/student/volgsysteem/page.tsx).

Het bestaande invulscherm draait in app/student/volgsysteem/VolgsysteemClient.tsx (client).

Admin · Bekwaamheidsstatus werkt:

Cohort dropdown + studentenlijst + afvinken tentamens/MBK/PSBK.

Per student doorklik naar studentkaart (opleidingsdossier) met compacte invoer voor praktijkvorming (tellingen).

System setting: CURRENT_UITVOERING_ID toegevoegd en werkend:

API endpoint geeft JSON terug: {"ok":true,"uitvoeringId":"25/26"}.

Admin menu uitgebreid met Systeem tab.

Admin systeempagina bestaat (/admin/system) en haalt instelling op (na fix) en kan hem opslaan.

Fix uitgevoerd: 404 door fout pad/naamgeving bij API route; endpoint is nu bereikbaar.

Wat staat klaar / volgende stap

Student dashboard groeperen op CURRENT_UITVOERING_ID (25/26 bovenaan, archief eronder).

Archief-view in volgsysteem via enrollmentId + read-only (en geen “ensure” aanmaak) afronden als we die UX definitief willen.

Risico’s / aandacht

Route-namen met speciale tekens (zoals current-uitvoering) kunnen onzichtbaar fout gaan door “niet-standaard” hyphens → handmatig typen bij aanmaken.

ACTIVE_STUDENT_ID is nog tijdelijk in student dashboard; later vervangen door /api/me (auth/impersonation).