# Реализованные фичи (текущее состояние)

## Последние изменения (август 2026)

### Служебное меню модулей закрыто PIN-кодом
Окно активации модулей (Ctrl + Shift + Backspace + 1, кнопок в интерфейсе нет) сначала
спрашивает PIN — **9339**, константа `SERVICE_PIN` в
`frontend/src/components/organisms/ModuleActivation/ModuleActivation.tsx`. До ввода окно
не показывает ни список модулей, ни режим парковки и не читает настройки с сервера.
PIN спрашивается при каждом открытии. Это защита от случайного нажатия комбинации и от
правки с открытого рабочего места: код лежит в собранном фронтенде, а настоящее
ограничение — права пользователя на сохранение системных настроек.

### Парковка — белый список вместо пропусков, списки на своих страницах
Разрешение на въезд — это сама карточка машины в **белом списке** (бывшая «База автомобилей»,
страница `/parking/vehicles`). Отдельная страница пропусков убрана: регистрация машины
состоит из четырёх полей — **номер ТС**, **владелец** (из справочника владельцев мест),
**дата окончания лицензии** (по умолчанию год вперёд, пусто — бессрочно) и **зона доступа**
(пусто — все зоны). Марка, цвет, тип, телефон, компания, фото, категория и лимит стоянки
остались под кнопкой «Дополнительно» — на проезд они не влияют.

Поля живут в `parking_vehicles`: `AccessValidTo` и `ZoneId` (миграция `AddParkingVehicleAccess`
переносит в них сроки и зоны действующих пропусков, чтобы после обновления никто не потерял
доступ). Таблица `parking_permits` остаётся только ради истории, эндпоинты `/api/parking/permits`
удалены, а `/parking/ap-permits` перенаправляет на белый список.

Решение о въезде (`ParkingAccessService`): чёрный список → абонемент → белый список
(причины отказа `not-in-whitelist`, `license-expired`, `wrong-zone`) → квота владельца мест →
режим парковки. Причина разрешения в журнале — `whitelist`.

**Чёрный список** (`/parking/blacklist`) и **владельцы мест** (`/parking/holders`) вынесены
из служебного окна парковки на свои страницы в меню модуля; в окне под шестерёнкой остались
только настройки и структура зон.

### Парковка — кто открывает шлагбаум
Две рабочие схемы, выбор — в карточке ANPR-камеры (вкладка «Устройства»), поле **«Реле шлагбаума»**:

- **пусто или 0** — шлагбаум открывает сама камера по своему внутреннему списку номеров.
  Сервер только ведёт учёт: сессии, места, деньги, журнал. Чёрный список и режим
  «по белому списку» при этом фиксируют нарушение, но не мешают проезду.
- **номер релейного выхода** — решает сервер. Камера распознаёт номер, `ParkingAccessService`
  принимает решение, `ParkingBarrierService` даёт импульс на реле
  (`PUT ISAPI/System/IO/outputs/{N}/trigger`), две попытки; неудача пишется в журнал
  парковки событием `camera_error`. **На самой камере при этом нужно очистить список
  номеров / отвязать реле от её встроенного распознавания** — иначе она откроет параллельно.

Шлагбаум открывается на всех путях, а не только по камере: въезд и выезд по ANPR,
ручной въезд с POS (`/api/parking/access-decision`), ручной выпуск оператором
(`/api/parking/exit` — кнопка «Выпустить» на POS). Проверка реле при пусконаладке —
кнопка «Проверить шлагбаум» в карточке камеры (`POST /api/devices/{id}/barrier-test`).

Номер выхода можно задать и глобально настройкой `parking.barrierOutput` — она работает
как запасное значение для камер, у которых поле не заполнено.

### Парковка — фильтр распознавания перед открытием
Порядок обработки кадра с ANPR-камеры: дедупликация → **проверка номера** → направление →
**«уже внутри?»** → решение (чёрный список, белый список, места) → импульс на шлагбаум.

Проверка номера (`PlateQuality`) идёт по **сырой** строке, а не по нормализованной: нормализация
оставляет только буквы и цифры, поэтому «10-A?-100» иначе превратилась бы в «10A100» — чужой,
но правдоподобный номер. Отбраковка: незакрытые позиции (`? * _ # �`), пустой номер, длина ниже
минимума, отсутствие цифр, процент распознавания ниже выбранного уровня, несовпадение с шаблоном.
Каждый отказ пишется в журнал событием `recognition_error` с сырым номером и причиной.

Повторный въезд машины, которая уже числится внутри, шлагбаум не открывает
(событие `denied` / `already-inside`) — это либо повторное распознавание, либо «паровозик».
Если выезд был пропущен и машина «застряла» внутри, оператор закрывает сессию кнопкой
«Выпустить» на кассе.

Настройки — в служебном окне парковки (шестерёнка), блок «Распознавание номеров»:
`parking.minPlateConfidence` — уровень распознавания, в интерфейсе выбирается процентом
(«Не проверять», 50…95%), хранится долей 0..1; запись процентом («80») тоже понимается.
`parking.requireConfidence` (по умолчанию выключено) — отбраковывать кадр, если камера
процент не прислала: поле есть не во всех прошивках, поэтому по умолчанию такой кадр
проходит проверку (причина отказа — `no-confidence`).
`parking.minPlateLength` (по умолчанию 5), `parking.platePattern` (regex по нормализованному
номеру, пусто — не проверять), `parking.allowReentryWhileInside` (по умолчанию выключено).

### Парковка — режим проезда и ручные операции
Настройка `parking.flowMode` (шестерёнка → «Режим проезда»), не зависит от платности:

- **`EntryExit`** (по умолчанию) — камеры оформляют обе стороны, выездная камера сама
  закрывает сессию и освобождает место.
- **`EntryOnly`** — камеры оформляют только въезд, сессию закрывает оператор. Камера,
  помеченная как выездная, в этом режиме кадры не оформляет вообще: она остаётся «глазами»
  и реле для ручного открытия.

Ручные операции доступны в обоих режимах:

- **Снять машину с парковки** — крестик в списке «Сейчас на парковке»:
  `POST /api/parking/sessions/{id}/close` с выбором «снять и открыть шлагбаум» или
  «только снять» (машина уже уехала мимо камеры). Неоплаченное уходит в долг, место
  освобождается, в журнал пишется `manual_open`.
- **Открыть шлагбаум** — кнопка на плитке камеры и в развёрнутом окне:
  `POST /api/parking/cameras/{id}/open`.
- На кассе (POS) остаётся кнопка «Выпустить» по номеру.

### Парковка — камеры в зонах
На странице управления под схемой зоны — плитки камер этой зоны: въезд слева, выезд справа,
имя камеры, зона, IP и точка статуса (ARP). Клик разворачивает камеру на весь диалог.

Браузер не проигрывает RTSP, поэтому «видео» собирается из кадров:
`GET /api/parking/cameras/{id}/snapshot` берёт снимок у камеры по ISAPI
(`Streaming/channels/102|101|1/picture`, рабочий путь запоминается) и отдаёт JPEG. Пароль
камеры остаётся на сервере, страница запрашивает кадры с JWT: 1 кадр/с в плитке, ~3 кадра/с
в развёрнутом виде, пауза при скрытой вкладке. В развёрнутом окне есть RTSP-адрес
(`rtsp://IP:554/Streaming/Channels/101`, без логина и пароля) с кнопкой «Копировать» — для VLC.
Список камер — `GET /api/parking/cameras`.

### Парковка — живой мониторинг
`GET /api/parking/live` (опрос раз в 5 сек со страницы управления): машины внутри с номерами,
местом и временем стоянки, лента въездов/выездов/отказов за 24 часа, карта занятых мест.
Сессия занимает конкретное место (`ParkingSession.SpaceId`), на схеме занятые места
подсвечены и подписаны номером машины.

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

## Первый вход (без seed-пользователя)

Пользователь **не создаётся из конфигурации** (seed отсутствует). При первом запуске, если в БД ещё нет учётных записей, UI перенаправляет на **Initial Setup** (`/setup-password`): администратор задаёт **email и пароль** первого администратора. После этого вход — через обычный `/login`.

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
