# Self-Service Portal API

Base URL: `http://127.0.0.1:5154`

Все эндпоинты кроме `/login` требуют заголовок:
```
Authorization: Bearer <token>
```
Токен получается при логине и действителен для роли `Employee`.

---

## Аутентификация

### POST /api/self-service/login

Вход сотрудника.

**Request body:**
```json
{
  "email": "employee@example.com",
  "password": "string"
}
```

**Response 200:**
```json
{
  "token": "eyJ...",
  "employeeId": "uuid",
  "requiresPasswordSetup": true
}
```
Если `requiresPasswordSetup: true` — сотрудник должен сменить пароль через `/change-password` перед использованием портала.

**Response 401:** Неверные credentials или пользователь не является сотрудником.

---

### POST /api/self-service/change-password

Смена пароля. Используется при первом входе (временный пароль) и при обычной смене.

**Headers:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

Минимальная длина нового пароля — **6 символов**.

**Response 204:** Пароль успешно изменён.

**Response 400:**
```json
{ "message": "Current password is incorrect." }
{ "message": "Password must be at least 6 characters." }
```

---

## Профиль

### GET /api/self-service/me

Возвращает профиль текущего сотрудника и его записи посещаемости за сегодня (UTC).

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": "uuid",
  "firstName": "Adil",
  "lastName": "Hasanov",
  "employeeNo": "001",
  "department": "IT",
  "workSchedule": {
    "id": "uuid",
    "name": "Стандартный",
    "type": "Fixed"
  },
  "todayRecords": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "employeeName": "",
      "eventTimeUtc": "2026-05-19T07:00:00Z",
      "eventType": "CheckIn",
      "deviceId": "uuid",
      "source": "Device",
      "createdUtc": "2026-05-19T07:00:01Z"
    }
  ]
}
```

`workSchedule` может быть `null` если расписание не назначено.

---

## Заявки на корректировку

### GET /api/self-service/requests

Список заявок текущего сотрудника (последние 50, по убыванию даты).

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "employeeName": "",
    "type": "CheckIn",
    "requestedTimeUtc": "2026-05-19T07:00:00Z",
    "requestedEndTimeUtc": null,
    "comment": "Забыл отметиться",
    "status": "Pending",
    "reviewedByUserId": null,
    "reviewedAtUtc": null,
    "reviewComment": null,
    "createdUtc": "2026-05-19T09:00:00Z",
    "latitude": 40.4093,
    "longitude": 49.8671,
    "geoZoneName": "Офис"
  }
]
```

**Значения `type`:** `CheckIn` | `CheckOut` | `LeaveRequest`

**Значения `status`:** `Pending` | `Approved` | `Rejected`

---

### POST /api/self-service/requests

Создать заявку на корректировку.

**Headers:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "type": "CheckIn",
  "requestedTimeUtc": "2026-05-19T07:00:00Z",
  "requestedEndTimeUtc": null,
  "comment": "Не успел отметиться",
  "latitude": 40.4093,
  "longitude": 49.8671
}
```

| Поле | Обязательно | Описание |
|------|------------|----------|
| `type` | да | `CheckIn`, `CheckOut`, `LeaveRequest` |
| `requestedTimeUtc` | да | Время события (ISO 8601) |
| `requestedEndTimeUtc` | нет | Конец периода (для `LeaveRequest`) |
| `comment` | нет | Комментарий |
| `latitude` | нет | Широта (для геопроверки) |
| `longitude` | нет | Долгота (для геопроверки) |

**Автоматическое одобрение:** если тип `CheckIn`/`CheckOut` и координаты попадают в радиус активной геозоны — заявка автоматически получает статус `Approved` и создаётся корректировка посещаемости.

**Response 201:**
```json
{
  "id": "uuid",
  "type": "CheckIn",
  "requestedTimeUtc": "2026-05-19T07:00:00Z",
  "status": "Approved",
  "autoApproved": true,
  "matchedZone": "Офис"
}
```

**Response 400:**
```json
{ "message": "Invalid request type." }
```
