# Database Overzicht (Prisma)

Datasource:
- PostgreSQL (Neon)
- DATABASE_URL = pooled
- DIRECT_URL = direct (voor migrations)

Belangrijke modellen:

User
- id (cuid)
- crmCustomerId (unique)
- role (enum)

Cohort
- uitvoeringId (unique)

Enrollment
- userId + cohortId unique
- assessmentLocked (boolean)

Assessment
- unique: studentId + rubricKey + moment

Score
- unique: assessmentId + themeId + questionId

TeacherScore
- unique: assessmentId + teacherId + themeId + questionId

TeacherReview
- unique: assessmentId + teacherId
- status: DRAFT / PUBLISHED

Enums:
- Role
- Moment
- ReviewStatus
