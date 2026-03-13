# Backend API

## Base URL

- `http://localhost:5154`
- `https://localhost:7055`

## Устройства — только реальные данные

Все данные об устройствах получаются от реальных Hikvision-устройств в сети. Mock-данные не используются.
- **Discover** — ISAPI (HTTP `GET /ISAPI/System/deviceInfo`). Не требует SDK. Сканирует подсеть на портах 80, 443, 8000.
- **Connect/Disconnect** — Hikvision HCNetSDK (NET_DVR_Login_V40, NET_DVR_Logout_V30)
- **Events** — события от подключённых устройств через SDK

**Важно:** Для артефактов используется HCNetSDK из `winSDK\lib` (не HPNetSDK). HCNetSDK нужен для активации (`NET_DVR_ActivateDevice`). Discover — через ISAPI, не требует SDK.

**Настройка** в appsettings.json:
- `Hikvision:Username` — логин устройства (по умолчанию admin)
- `Hikvision:Password` — пароль устройства (по умолчанию 12345, смените под ваши устройства)
- `Hikvision:DiscoveryPorts` — порты для поиска (по умолчанию 80,443,8000)

## Аутентификация

- Используется JWT Bearer токен.
- Для защищенных endpoint передавайте заголовок:
  - `Authorization: Bearer <accessToken>`

## Endpoints

## Модели и справочники

- `deviceType`:
  - `1` — `AccessController`
  - `2` — `Intercom`
  - `3` — `AttendanceTerminal`
- `status` в device API: `Online` или `Offline`.
- Все даты передаются в UTC (ISO-8601), например: `2026-02-25T12:40:00Z`.

### Структуры ответов API устройств

| Endpoint | Возвращает |
|----------|------------|
| `GET /api/devices/discover` | `[{ deviceIdentifier, name, ipAddress, port, model, deviceType, macAddress, firmwareVersion }]` |
| `GET /api/devices` | `[{ id, deviceIdentifier, name, ipAddress, port, location, deviceType, status, lastSeenUtc }]` |
| `GET /api/devices/{id}` | Один объект устройства (те же поля) |
| `POST /api/devices` | Созданное устройство (201) |
| `PUT /api/devices/{id}` | Обновлённое устройство |
| `POST /api/devices/{id}/connect` | Устройство с актуальным status |
| `POST /api/devices/{id}/disconnect` | Устройство с актуальным status |
| `GET /api/devices/{id}/status` | `{ deviceId, deviceIdentifier, status, lastSeenUtc }` |
| `GET /api/devices/{id}/users-raw?format=xml` | Raw XML ответ UserInfo/Search с устройства |
| `GET /api/devices/{id}/users-raw?format=json` | Raw JSON ответ UserInfo/Search с устройства |
| `GET /api/devices/statuses` | `[{ deviceId, deviceIdentifier, status, lastSeenUtc }]` |
| `GET /api/devices/events?take=100` | `[{ deviceIdentifier, eventType, occurredUtc, payload }]` |

### 1) Health Check

- **Method:** `GET`
- **Path:** `/api/health`
- **Auth:** не требуется
- **Response 200:**

```json
{
  "status": "ok",
  "utc": "2026-02-24T20:00:00Z"
}
```

### 1.1) SDK Health

- **Method:** `GET`
- **Path:** `/api/health/sdk`
- **Auth:** не требуется
- **Назначение:** диагностика состояния Hikvision SDK (инициализация, активные сессии, последний код ошибки с контекстом устройства, пути поиска библиотек).
- **Response 200:**

```json
{
  "initialized": true,
  "platform": "Microsoft Windows 10.0.26200",
  "connectedDevices": 2,
  "lastErrorCode": "29",
  "lastErrorMessage": "Device is unreachable.",
  "lastErrorHint": "Check IP address, port, NAT, and whether service is running on device.",
  "lastErrorDevice": "DS-K1T342MFX-E120250307V043800ENGB9637211",
  "lastErrorCategory": "network",
  "librarySearchPaths": [
    "C:\\projectx\\winSDK\\lib",
    "C:\\projectx\\artifacts\\installer\\backend-publish"
  ]
}
```

- **lastErrorDevice** — идентификатор устройства или `IP:port`, вызвавшего последнюю ошибку (при Login или PullAcsEvents).
- **lastErrorCategory** — категория ошибки: `network` (7, 8, 9, 10, 11, 29, 72, 73), `auth` (1, 23, 76, 153), `other`.

### 2) Регистрация пользователя

- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Auth:** 
  - если пользователей в системе еще нет — не требуется (создастся `Admin`)
  - если хотя бы один пользователь уже существует — требуется токен пользователя с ролью `Admin`
- **Request body:**

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "SecurityOperator"
}
```

- **Допустимые роли:** `Admin`, `SecurityOperator`, `HrOperator`
- **Response 200:**

```json
{
  "message": "User created.",
  "role": "SecurityOperator"
}
```

- **Возможные ошибки:**
  - `400` — неверная роль / ошибки валидации пароля
  - `403` — нет прав на создание пользователя
  - `409` — пользователь с таким email уже существует

### 3) Логин

- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Auth:** не требуется
- **Request body:**

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

- **Response 200:**

```json
{
  "accessToken": "<jwt>",
  "expiresInMinutes": 60,
  "user": {
    "id": "00000000-0000-0000-0000-000000000000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["SecurityOperator"]
  }
}
```

- **Возможные ошибки:**
  - `401` — неверный email или пароль

### 3.1) Восстановление пароля (запрос токена)

- **Method:** `POST`
- **Path:** `/api/auth/forgot-password`
- **Auth:** не требуется
- **Request body:**

```json
{
  "email": "user@example.com"
}
```

- **Response 200 (Production):**

```json
{
  "message": "If an account exists with this email, a reset link has been sent."
}
```

- **Response 200 (Development):** дополнительно возвращается `token` для использования в reset-password:

```json
{
  "message": "Password reset token generated.",
  "token": "<base64-token>"
}
```

### 3.2) Восстановление пароля (сброс по токену)

- **Method:** `POST`
- **Path:** `/api/auth/reset-password`
- **Auth:** не требуется
- **Request body:**

```json
{
  "email": "user@example.com",
  "token": "<token-from-forgot-password>",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

- **Response 200:**

```json
{
  "message": "Password has been reset. You can now sign in."
}
```

- **Возможные ошибки:** `400` — неверный email, истёкший или неверный токен, пароли не совпадают, пароль короче 8 символов.

### 4) Текущий пользователь

- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Auth:** требуется JWT Bearer
- **Response 200:**

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "email": "user@example.com",
  "roles": ["Admin"]
}
```

- **Возможные ошибки:**
  - `401` — отсутствует или недействительный токен

### 5) Поиск устройств в LAN (Discover)

- **Method:** `GET`
- **Path:** `/api/devices/discover`
- **Auth:** не требуется (AllowAnonymous)
- **Описание:** Сканирует локальную подсеть через ISAPI (`GET /ISAPI/System/deviceInfo`). Использует `Hikvision:Username`, `Hikvision:Password`, `Hikvision:DiscoveryPorts` (по умолчанию 80, 443, 8000).
- **Response 200:** массив найденных устройств (пустой `[]` если ничего не найдено):

```json
[
  {
    "deviceIdentifier": "DS-K1A802",
    "name": "Hikvision 192.168.1.50",
    "ipAddress": "192.168.1.50",
    "port": 80,
    "model": "DS-K1A802"
  },
  {
    "deviceIdentifier": "ISAPI-192-168-1-51-8000",
    "name": "Hikvision 192.168.1.51",
    "ipAddress": "192.168.1.51",
    "port": 8000,
    "model": null
  }
]
```

Поля:
- `deviceIdentifier` — серийный номер из устройства или `ISAPI-{ip}-{port}` если серийник недоступен
- `name` — имя устройства из XML или `Hikvision {ip}`
- `ipAddress`, `port` — адрес и порт
- `model` — модель из `/ISAPI/System/deviceInfo` или `null`

### 6) CRUD устройств

- **`GET /api/devices`** — список устройств.
- **`GET /api/devices/{id}`** — карточка устройства.
- **`POST /api/devices`** — создать устройство.
- **`PUT /api/devices/{id}`** — обновить устройство.
- **`DELETE /api/devices/{id}`** — удалить устройство.
- **Auth для всех операций:** требуется JWT Bearer.

Пример `POST /api/devices`:

```json
{
  "deviceIdentifier": "AC-ENTRANCE-01",
  "name": "Entrance Controller",
  "ipAddress": "192.168.1.50",
  "port": 8000,
  "location": "HQ / Gate A",
  "deviceType": 1
}
```

Пример ответа устройства:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "deviceIdentifier": "AC-ENTRANCE-01",
  "name": "Entrance Controller",
  "ipAddress": "192.168.1.50",
  "port": 8000,
  "location": "HQ / Gate A",
  "deviceType": "AccessController",
  "status": "Online",
  "lastSeenUtc": "2026-02-25T12:40:00Z"
}
```

Возможные ошибки:

- `404` — устройство не найдено (`GET /{id}`, `PUT`, `DELETE`)
- `409` — конфликт `deviceIdentifier` (дублирование)

### 6.1) CRUD Access Levels

- **`GET /api/access-levels`** — список всех уровней доступа (сортировка по Name).
- **`GET /api/access-levels/{id}`** — один уровень по Id.
- **`POST /api/access-levels`** — создать уровень (проверка уникальности Name).
- **`PUT /api/access-levels/{id}`** — обновить уровень.
- **`DELETE /api/access-levels/{id}`** — удалить уровень (CASCADE по связям Employee/Visitor).
- **Auth для всех операций:** требуется JWT Bearer.

Пример `POST /api/access-levels`:

```json
{
  "name": "Full Access",
  "description": "24/7 unrestricted access to main areas"
}
```

Пример ответа:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "name": "Full Access",
  "description": "24/7 unrestricted access to main areas",
  "createdUtc": "2026-03-05T12:00:00Z",
  "updatedUtc": null
}
```

Возможные ошибки:

- `400` — Name пустой
- `404` — уровень не найден (`GET /{id}`, `PUT`, `DELETE`)
- `409` — конфликт Name (дублирование)

### 7) Подключение и отключение устройства

- **Method:** `POST`
- **Path:** `/api/devices/{id}/connect`
- **Auth:** требуется JWT Bearer
- **Response 200:** карточка устройства (как в CRUD)

- **Method:** `POST`
- **Path:** `/api/devices/{id}/disconnect`
- **Auth:** требуется JWT Bearer
- **Response 200:** карточка устройства (как в CRUD)

Оба endpoint возвращают актуальную карточку устройства с `status` и `lastSeenUtc`.

Возможные ошибки:

- `404` — устройство не найдено

### 8) Realtime статус

- **Method:** `GET`
- **Path:** `/api/devices/{id}/status`
- **Auth:** требуется JWT Bearer
- **Response 200:**

```json
{
  "deviceId": "00000000-0000-0000-0000-000000000000",
  "deviceIdentifier": "AC-ENTRANCE-01",
  "status": "Online",
  "lastSeenUtc": "2026-02-25T12:40:00Z"
}
```

- **Method:** `GET`
- **Path:** `/api/devices/statuses`
- **Auth:** требуется JWT Bearer
- **Response 200:** массив статусов по всем устройствам (`Online/Offline` через `status`, а также `lastSeenUtc`).

Пример ответа:

```json
[
  {
    "deviceId": "00000000-0000-0000-0000-000000000000",
    "deviceIdentifier": "AC-ENTRANCE-01",
    "status": "Online",
    "lastSeenUtc": "2026-02-25T12:40:00Z"
  },
  {
    "deviceId": "11111111-1111-1111-1111-111111111111",
    "deviceIdentifier": "IC-LOBBY-01",
    "status": "Offline",
    "lastSeenUtc": "2026-02-25T12:00:00Z"
  }
]
```

### 9) События устройств

- **Method:** `GET`
- **Path:** `/api/devices/events?take=100`
- **Auth:** требуется JWT Bearer
- **Response 200:** последние события от SDK (`DoorOpened`, `AccessGranted`, `AccessDenied`, `Heartbeat`, `Unknown`).

Параметры:

- `take` (опционально) — сколько событий вернуть, диапазон `1..1000`, по умолчанию `100`.

Пример ответа:

```json
[
  {
    "deviceIdentifier": "AC-ENTRANCE-01",
    "eventType": "Heartbeat",
    "occurredUtc": "2026-02-25T12:40:00Z",
    "payload": "{\"source\":\"hikvision-sdk\",\"status\":\"connected\"}"
  }
]
```

### 10) Системный мониторинг и управление службой

- **Method:** `GET`
- **Path:** `/api/system/status`
- **Auth:** требуется JWT Bearer
- **Response 200:**

```json
{
  "serverStatus": "Running",
  "serviceName": "ProjectXBackend",
  "serviceState": "Running",
  "serviceMessage": "Service status resolved.",
  "dbStatus": "Connected",
  "dbLatencyMs": 12.4,
  "dbMessage": "Database connection is healthy.",
  "utc": "2026-02-25T14:10:00Z"
}
```

- **Method:** `POST`
- **Path:** `/api/system/service/{action}`
- **Auth:** требуется JWT Bearer
- **Ограничения:** запрос должен идти с `loopback` (`127.0.0.1` / `::1`), опционально проверяется заголовок `X-Local-Control-Key` если задан `SystemMonitor:LocalControlKey`.
- **Action:** `start | stop | restart`

Пример ответа:

```json
{
  "success": true,
  "serviceName": "ProjectXBackend",
  "serviceState": "Running",
  "message": "Service restarted."
}
```

- **Method:** `GET`
- **Path:** `/api/health/db`
- **Auth:** не требуется
- **Назначение:** отдельная проверка доступности БД для установщика/мониторинга.

### 11) Service Manager (как в панели сервисов)

- **Method:** `GET`
- **Path:** `/api/system/services`
- **Auth:** требуется JWT Bearer
- **Response 200:** список управляемых сервисов с текущим состоянием.

```json
[
  {
    "key": "backend",
    "serviceName": "ProjectXBackend",
    "displayName": "ProjectX Backend Service",
    "port": "5055",
    "isControllable": true,
    "serviceState": "Running",
    "message": "Service status resolved."
  }
]
```

- **Method:** `POST`
- **Path:** `/api/system/services/{key}/{action}`
- **Auth:** требуется JWT Bearer
- **Action:** `start | stop | restart`
- **Ограничения:** loopback + `X-Local-Control-Key` (если включен).

- **Method:** `POST`
- **Path:** `/api/system/services/{action}-all`
- **Auth:** требуется JWT Bearer
- **Action:** `start | stop | restart`
- **Назначение:** массовая операция по всем `isControllable=true` сервисам.
