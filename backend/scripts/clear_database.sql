-- Очистка данных приложения (PostgreSQL).
-- НЕ удаляет: __EFMigrationsHistory (миграции), device_statuses (справочник Online/Offline/Unknown).
-- После очистки перезапустите бэкенд: роли AspNet создадутся заново; первого администратора создайте через страницу Initial Setup (почта и пароль задаются вручную).

BEGIN;

TRUNCATE TABLE
  cards,
  faces,
  fingerprints,
  employee_access_levels,
  visitor_access_levels,
  access_level_doors,
  employees,
  visitors,
  departments,
  devices,
  access_levels,
  companies,
  system_settings,
  "AspNetUserTokens",
  "AspNetUserRoles",
  "AspNetUserLogins",
  "AspNetUserClaims",
  "AspNetRoleClaims",
  "AspNetUsers",
  "AspNetRoles"
RESTART IDENTITY CASCADE;

COMMIT;
