# Architectuur Overzicht

## Rollen
- STUDENT
- TEACHER
- ADMIN

Role preview bestaat via query param (?preview=1&asRole=student) maar is geen echte auth.

## Kernstructuur

User
- Heeft role
- Heeft enrollments
- Heeft assessments (als student)
- Heeft teacherScores / teacherReviews (als docent)

Cohort
- Is een uitvoering
- Heeft enrollments

Enrollment
- Verbindt User ↔ Cohort
- Bevat assessmentLocked boolean

Assessment
- 1 per student per rubricKey per moment
- Bevat scores (student)
- Bevat teacherScores (docent per vraag)
- Bevat teacherReviews (publicatie laag)

## Lock logica
Lock zit op:
Enrollment.assessmentLocked

Niet op Assessment zelf.

## Deploy strategie
- Vercel build: alleen npm run build
- Prisma generate via postinstall
- Migrations handmatig

Assessment
- studentId
- rubricKey
- moment
- submittedAt (nullable)

25-02-2026 update:
Nieuwe componenten / routes

UI routes:

app/student/volgsysteem/page.tsx (server wrapper met teruglink)

app/student/volgsysteem/VolgsysteemClient.tsx (client invulscherm)

app/admin/system/page.tsx (admin UI voor systeeminstellingen)

API routes:

app/api/admin/system/current-uitvoering/route.ts (GET/POST system setting)

(blijft bestaan) app/api/system/current-uitvoering/... als consumer endpoint (afhankelijk van hoe jij hem hebt ingericht)

Navigatie:

app/admin/AdminNav.tsx uitgebreid met tab Systeem → /admin/system.

Datamodel

Nieuw model: SystemSetting { key (PK), value, updatedAt }

Doel: centrale bestuurlijke settings (nu: CURRENT_UITVOERING_ID) zonder code deploy.

Conceptuele wijziging

“Huidig” wordt losgekoppeld van “nieuwste enrollment” en gebaseerd op schooljaar/uitvoeringId:

CURRENT_UITVOERING_ID bepaalt welke cohorts als “huidige uitvoering” gelden.

Binnen één uitvoering kunnen meerdere cohorts bestaan (Basisjaar/1VO/2VO/3VO; eventueel meerdere groepen).

Toepassing

Admin: kan schooljaar wisselen via /admin/system.

Student: dashboard/archief indeling kan hierop leunen (huidig schooljaar vs eerdere jaren).

Als je wilt, kan ik ook meteen een mini “02-changelog” bulletlijst maken voor je snapshotcommit (alle gewijzigde/nieuwe paden in één lijst).