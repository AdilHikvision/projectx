# Backend API

## Base URL

- `http://localhost:5154`
- `https://localhost:7055`

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

### 5) Поиск устройств в LAN

- **Method:** `GET`
- **Path:** `/api/devices/discover`
- **Auth:** требуется JWT Bearer
- **Response 200:**

```json
[
  {
    "deviceIdentifier": "MOCK-AC-001",
    "name": "Mock Access Controller #1",
    "ipAddress": "192.168.1.101",
    "port": 8000,
    "model": "AC-Controller"
  }
]
```

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
    "payload": "{\"source\":\"mock-sdk\",\"status\":\"alive\"}"
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
