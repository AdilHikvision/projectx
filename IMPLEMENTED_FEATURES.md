# Реализованные фичи (текущее состояние)

## 1) Backend (ASP.NET Core Web API)

- JWT-аутентификация:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Ролевая модель пользователей:
  - `Admin`
  - `SecurityOperator`
  - `HrOperator`
- CRUD по устройствам:
  - `GET /api/devices`
  - `GET /api/devices/{id}`
  - `POST /api/devices`
  - `PUT /api/devices/{id}`
  - `DELETE /api/devices/{id}`
- Управление подключением устройств:
  - `POST /api/devices/{id}/connect`
  - `POST /api/devices/{id}/disconnect`
- Realtime-статусы:
  - `GET /api/devices/{id}/status`
  - `GET /api/devices/statuses`
- События устройств:
  - `GET /api/devices/events?take=...`
- Мониторинг и сервисные endpoint:
  - `GET /api/health`
  - `GET /api/health/db`
  - `GET /api/health/sdk`
  - `GET /api/system/status`
  - `POST /api/system/service/{action}` (`start|stop|restart`, loopback-only)
- Фоновая обработка:
  - Hosted service для опроса событий SDK
  - Heartbeat-обновление `lastSeen`
  - Перевод «застоявшихся» подключений в offline

## 2) Интеграция Hikvision SDK

- Реализован `HikvisionSdkClient` и подключен в DI вместо mock-клиента.
- Реальные вызовы SDK:
  - `NET_DVR_Init` / `NET_DVR_Cleanup`
  - `NET_DVR_Login_V40` / `NET_DVR_Logout_V30`
  - `NET_DVR_StartRemoteConfig` / `NET_DVR_GetNextRemoteConfig` / `NET_DVR_StopRemoteConfig`
  - `NET_DVR_SetConnectTime`, `NET_DVR_SetReconnect`, `NET_DVR_SetLogToFile`
- Реализован LAN discovery в backend:
  - сканирование локальных подсетей и проверка доступности/логина устройств.
- Реализована диагностика SDK:
  - инициализация, количество активных подключений,
  - последний код/описание ошибки,
  - используемые пути поиска библиотек.
- Поддержан runtime-конфиг путей нативных библиотек:
  - Windows (`PATH`)
  - Linux (`LD_LIBRARY_PATH`)
  - источники: `Hikvision:SdkPath` и `HIKVISION_SDK_PATH`.

## 3) Frontend (React + Vite + TypeScript)

- Аутентификация:
  - страница логина
  - хранение токена и пользователя в `localStorage`
  - защищенные маршруты
- Страница устройств:
  - список устройств
  - создание/удаление
  - connect/disconnect
  - отображение статусов и `lastSeen`
  - блок «Последние события»
  - realtime через SignalR + fallback на polling
- LAN discovery в UI:
  - кнопка «Сканировать LAN»
  - таблица найденных устройств
  - действия:
    - «Добавить» (сразу в реестр)
    - «В форму» (автоподстановка в форму создания)
- Страница системы:
  - общий статус backend-службы и БД
  - кнопки управления службой (`start/stop/restart`)
  - блок «Диагностика SDK» (`/api/health/sdk`)

## 4) Конфигурация и инфраструктура

- PostgreSQL интеграция через EF Core + миграции.
- Конфиги `appsettings.json` и `appsettings.Development.json` расширены секцией `Hikvision`.
- Серверные логи через Serilog.
- Инсталляторный pipeline:
  - `installer/build-artifacts.ps1` автоматически копирует Hikvision native зависимости (`*.dll` и `HCNetSDKCom`) в `artifacts\installer\backend-publish`.
  - Источник SDK для копирования:
    1. переменная окружения `HIKVISION_SDK_PATH`
    2. `winSDK\lib` в репозитории.
  - Добавлены предупреждения в сборке, если отсутствуют критичные SDK-файлы (`HCNetSDK.dll`, `HCCore.dll`, `hpr.dll`) или `HCNetSDKCom`.

## 5) Что уже работает end-to-end

- Авторизация -> вход в UI -> просмотр/управление устройствами.
- Поиск устройств в LAN из UI через backend.
- Подключение устройства через SDK и получение событий.
- Диагностика SDK и системного состояния в UI.

## 6) MVP Checklist (done / in-progress / planned)

### Done

- [done] JWT-аутентификация и роли пользователей.
- [done] CRUD устройств в backend.
- [done] Connect/disconnect устройств.
- [done] Realtime-статусы устройств + fallback polling во frontend.
- [done] Получение событий устройств через SDK (ACS remote config).
- [done] LAN discovery (backend + UI).
- [done] Discovery через чистый SADP API SDK (`NET_DVR_GetSadpInfoList`) без fallback scan+probe.
- [done] Диагностика SDK endpoint (`/api/health/sdk`) + UI-блок.
- [done] Расширенная карта ошибок Hikvision SDK + подсказки по устранению в UI.
- [done] Системный мониторинг backend-службы и БД.

### In-Progress

- [in-progress] Доработка Linux runtime:
  - [done] packaging `.so` зависимостей в `installer/build-artifacts.ps1` для `-Runtime linux-*`;
  - [done] добавлен runtime-aware выбор источника SDK (`linuxSDK\lib` / `winSDK\lib`);
  - [done] добавлен `AppContext.BaseDirectory` в поиск native библиотек SDK;
  - [done] локально проверена сборка `build-artifacts.ps1 -Runtime linux-x64`: `.so` и `HCNetSDKCom` копируются в `artifacts\installer\backend-publish`;
  - [in-progress] полевые проверки на целевой Linux среде (загрузка `.so`, login/discovery/events под systemd/production).
  - [in-progress] ТАСК на следующий раз: прогон чек-листа на Linux-хосте (systemd unit, `ldd` для `backend`/`libhcnetsdk.so`, проверка `/api/health/sdk`, connect/discovery/events в реальном запуске).

### Planned

- [planned] CRUD для сотрудников и посетителей.
- [planned] CRUD для карт / отпечатков / лиц.
- [planned] CRUD для Access Level.
- [planned] Time Attendance (сбор и расчёт).
- [planned] Payroll (базовый расчёт).
- [planned] Инсталлятор с проверкой SDK/DB/службы.
- [planned] E2E и интеграционные тесты для device flow и SDK health.
