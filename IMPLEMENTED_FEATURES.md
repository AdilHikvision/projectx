# Реализованные фичи (текущее состояние)

## Последние изменения (март 2026)

### Статус устройств — только через ARP
- Статус устройств определяется **исключительно через ARP-запросы** (Win32 `SendARP`, iphlpapi.dll).
- `DeviceArpStatusService` — фоновый опрос устройств из БД каждые 5 сек; статус **не хранится в БД** (только кэш в памяти и SignalR).
- `DeviceConnectionManager` больше не обновляет статус в БД; используется только для SDK-подключений (события).
- API `GET /api/devices/statuses` и `GET /api/devices/{id}/status` используют `IDeviceArpStatusService`.
- Online — после успешного ARP-ответа; Offline — после 2 подряд неудачных ARP-запросов.

### Диагностика SDK — контекст ошибки
- `GET /api/health/sdk` расширен полями `lastErrorDevice` и `lastErrorCategory`.
- Последняя ошибка сохраняется с привязкой к устройству при Login и PullAcsEvents.
- Категории: `network` (7, 8, 9, 10, 11, 29, 72, 73), `auth` (1, 23, 76, 153), `other`.
- В UI System Status — понятные сообщения: «Устройство вне сети» для network, «Проверьте логин и права» для auth.

### Frontend
- **System Status** — маршрут `/status` (исправлена ссылка в сайдбаре).
- **System Settings** — удалены блоки Security Protocol, Communication Nodes, PROJECT-X ENTERPRISE; удалены кнопки Cancel/Save Changes.
- **Курсоры** — `pointer` для кнопок, ссылок, табов; `default` для текстовых элементов.

---

## Креденшилы для входа

| Поле | Значение |
|------|----------|
| **Email** | `admin@projectx.local` |
| **Пароль** | `Admin123!Strong` |

Пароль задаётся в `backend/.env` (`SeedAdmin__Password`) или `appsettings.Development.json` (`SeedAdmin:Password`). При первом запуске создаётся seed-пользователь с этими данными.

---

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
- CRUD по Access Level:
  - `GET /api/access-levels`
  - `GET /api/access-levels/{id}`
  - `POST /api/access-levels`
  - `PUT /api/access-levels/{id}`
  - `DELETE /api/access-levels/{id}`
- Управление подключением устройств:
  - `POST /api/devices/{id}/connect`
  - `POST /api/devices/{id}/disconnect`
- Realtime-статусы (источник — ARP, не БД):
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
  - `DeviceArpStatusService` — ARP-опрос статусов устройств (статус не в БД)
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
  - последний код/описание ошибки с контекстом устройства (`lastErrorDevice`, `lastErrorCategory`),
  - используемые пути поиска библиотек.
- Поддержан runtime-конфиг путей нативных библиотек:
  - Windows (`PATH`)
  - Linux (`LD_LIBRARY_PATH`)
  - источники: `Hikvision:SdkPath` и `HIKVISION_SDK_PATH`.
- Активация неактивированных устройств:
  - Порядок попыток: SDK (HCNetSDK) → ISAPI → SADP.
  - ISAPI activate (Face Recognition Terminals): подтверждённый формат XML:
    ```xml
    <Activate version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
      <ActivateInfo>
        <password>{encryptedPassword}</password>
      </ActivateInfo>
    </Activate>
    ```
  - Challenge: POST `/ISAPI/Security/challenge` → PUT `/ISAPI/System/activate` с digest-шифрованием пароля.

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
- Страница системы (`/status`):
  - общий статус backend-службы и БД
  - кнопки управления службой (`start/stop/restart`)
  - блок «Диагностика SDK» с понятными сообщениями по типу ошибки (network/auth)
- Страница настроек (`/settings`):
  - General Settings (язык, таймзона, интервал обновления)
- Страница Access Levels (`/access-levels`):
  - CRUD уровней доступа (Name, Description)
  - поиск по имени и описанию

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
- [done] Активация устройств (SDK → ISAPI → SADP); ISAPI-формат: `<Activate><ActivateInfo><password>...</password></ActivateInfo></Activate>` (namespace `isapi.org/ver20`).
- [done] Статус устройств только через ARP (без хранения в БД).
- [done] SDK Health с контекстом ошибки (lastErrorDevice, lastErrorCategory).

### In-Progress

- [in-progress] Доработка Linux runtime:
  - [done] packaging `.so` зависимостей в `installer/build-artifacts.ps1` для `-Runtime linux-*`;
  - [done] добавлен runtime-aware выбор источника SDK (`linuxSDK\lib` / `winSDK\lib`);
  - [done] добавлен `AppContext.BaseDirectory` в поиск native библиотек SDK;
  - [done] локально проверена сборка `build-artifacts.ps1 -Runtime linux-x64`: `.so` и `HCNetSDKCom` копируются в `artifacts\installer\backend-publish`;
  - [in-progress] полевые проверки на целевой Linux среде (загрузка `.so`, login/discovery/events под systemd/production).
  - [in-progress] ТАСК на следующий раз: прогон чек-листа на Linux-хосте (systemd unit, `ldd` для `backend`/`libhcnetsdk.so`, проверка `/api/health/sdk`, connect/discovery/events в реальном запуске).

### Planned

- [done] CRUD для сотрудников и посетителей.
- [done] CRUD для карт / отпечатков / лиц.
- [planned] Time Attendance (сбор и расчёт).

### CRUD People & Credentials (март 2026)

- **Backend:** сущности Card, Face, Fingerprint; миграция AddCardsFacesFingerprints; EmployeeNo в Employee.
- **Backend:** IsapiClient (Digest Auth), DevicePersonSyncService — синхронизация UserInfo, CardInfo, Face, Fingerprint на устройства Hikvision через ISAPI.
- **Backend:** Удаление сотрудника/посетителя — полное удаление из БД и со всех устройств (UserInfoDetail/Delete), включая файлы лиц.
- **API:** `/api/employees`, `/api/visitors`, `/api/cards`, `/api/faces`, `/api/fingerprints` — полный CRUD + sync endpoints.
- **Frontend:** PeopleManagementPage — табы Сотрудники/Посетители, CRUD, уровни доступа.
- **Frontend:** PersonDetailPage (`/people/:type/:id`) — карты, лица, отпечатки с добавлением и синхронизацией на устройства.
- [planned] Payroll (базовый расчёт).
- [planned] Инсталлятор с проверкой SDK/DB/службы.
- [planned] E2E и интеграционные тесты для device flow и SDK health.
