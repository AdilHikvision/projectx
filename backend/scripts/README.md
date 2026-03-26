# Очистка базы данных (PostgreSQL)

## Что делает `clear_database.sql`

- Удаляет **все данные приложения**: устройства, сотрудники, посетители, карты, лица, отпечатки, уровни доступа, компании, настройки, пользователей Identity.
- **Сохраняет** таблицу `device_statuses` (справочник Online/Offline/Unknown) и **`__EFMigrationsHistory`** (история миграций EF).
- После очистки перезапустите API: роли создаются заново при старте; первого администратора создайте через страницу **Initial Setup** (почта и пароль вручную).

## Как выполнить

1. Установите клиент PostgreSQL (`psql`) или выполните SQL в **pgAdmin** / **DBeaver**.
2. Параметры подключения см. в `appsettings.Development.json` (по умолчанию порт **5433**, БД **projectx**).

**PowerShell** (из папки `backend/scripts`):

```powershell
.\clear-database.ps1
# или с другими параметрами:
.\clear-database.ps1 -DbHost localhost -Port 5433 -Database projectx -User projectx_user -Password 'ВАШ_ПАРОЛЬ'
```

**Вручную через psql:**

```bash
psql -h localhost -p 5433 -U projectx_user -d projectx -v ON_ERROR_STOP=1 -f clear_database.sql
```

## Полный сброс (редко нужно)

Если нужно **пересоздать схему с нуля**: удалить базу `projectx`, создать пустую, затем `dotnet ef database update` из каталога backend.
