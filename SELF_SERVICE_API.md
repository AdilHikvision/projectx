# Self-Service Portal API

Base URL: `http://127.0.0.1:5154`

Все эндпоинты кроме `/login` требуют заголовок:
```
Authorization: Bearer <token>
```
Токен получается при логине и действителен для роли `Employee`.

> **Scope.** Эти эндпоинты обслуживают только токен сотрудника (роль `Employee`).
> Все запросы автоматически ограничены сотрудником, чей `EmployeeId` зашит в токене —
> передать чужой `employeeId` в query / body нельзя.

---

## Эндпоинты — оглавление

| Метод | URL | Назначение |
|-------|-----|------------|
| POST | `/api/self-service/login` | Вход сотрудника |
| POST | `/api/self-service/change-password` | Смена пароля (включая первичную) |
| GET | `/api/self-service/me` | Профиль + записи за сегодня |
| GET | `/api/self-service/summary` | Сводка за месяц для виджета |
| GET | `/api/self-service/attendance` | История посещаемости (фильтр по диапазону) |
| GET | `/api/self-service/schedule` | Рабочий график на диапазон дат |
| GET | `/api/self-service/requests` | Список заявок (последние 50) |
| POST | `/api/self-service/requests` | Создать заявку (check-in/check-out/absence/vacation/overtime) |
| DELETE | `/api/self-service/requests/{id}` | Отменить Pending заявку |
| GET | `/api/self-service/leaves` | Список отпусков сотрудника |
| POST | `/api/self-service/leaves` | Подать запрос на отпуск |
| DELETE | `/api/self-service/leaves/{id}` | Отменить Pending отпуск |
| GET | `/api/self-service/payroll` | Расчётные листы (только Approved/Paid) |
| GET | `/api/self-service/notifications` | Уведомления пользователя |
| GET | `/api/self-service/notifications/unread-count` | Кол-во непрочитанных |
| POST | `/api/self-service/notifications/{id}/read` | Пометить одно прочитанным |
| POST | `/api/self-service/notifications/read-all` | Пометить все прочитанными |
| GET | `/api/self-service/geo-zones` | Активные геозоны для preview на клиенте |

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
    "type": "Standard"
  },
  "todayRecords": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "employeeName": "",
      "eventTimeUtc": "2026-05-19T07:00:00Z",
      "eventType": "In",
      "deviceId": "uuid",
      "source": "device",
      "createdUtc": "2026-05-19T07:00:01Z"
    }
  ]
}
```

`workSchedule` может быть `null`, если расписание не назначено.

---

### GET /api/self-service/summary

Сводка за месяц для виджета на дашборде.

**Query:**
- `year` — год (опционально, по умолчанию — текущий)
- `month` — месяц 1–12 (опционально, по умолчанию — текущий)

**Response 200:**
```json
{
  "year": 2026,
  "month": 5,
  "workedDays": 18,
  "recordsCount": 36,
  "pendingRequests": 1,
  "pendingLeaves": 0,
  "leaveDaysApproved": 3
}
```

| Поле | Описание |
|------|----------|
| `workedDays` | Кол-во разных дат с хотя бы одной записью посещения |
| `recordsCount` | Всего записей посещения за месяц |
| `pendingRequests` | Сколько собственных заявок в статусе Pending (всего, не только этот месяц) |
| `pendingLeaves` | Сколько собственных отпусков в статусе Pending |
| `leaveDaysApproved` | Кол-во дней одобренного отпуска, попадающих в этот месяц |

---

## Посещаемость

### GET /api/self-service/attendance

История собственных записей посещения (приход / уход с устройства или после одобрения).

**Query:**
- `from` — ISO datetime (опционально, по умолчанию — `now - 30d`)
- `to` — ISO datetime (опционально, по умолчанию — `now`)

Если диапазон больше 92 дней — `from` обрезается до `to - 92d`.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "employeeName": "",
    "eventTimeUtc": "2026-05-19T07:00:00Z",
    "eventType": "In",
    "deviceId": "uuid",
    "source": "device",
    "createdUtc": "2026-05-19T07:00:01Z"
  }
]
```

`eventType`: `In` | `Out`. `source`: `device` (с терминала) | `manual` (после одобрения заявки).

---

### GET /api/self-service/schedule

Рабочий график сотрудника на диапазон дат: дефолтное расписание + точечные `DayPattern` + наложение отпусков.

**Query:**
- `from` — `YYYY-MM-DD` (опционально, по умолчанию — 1-е число текущего месяца)
- `to` — `YYYY-MM-DD` (опционально, по умолчанию — последнее число текущего месяца)

Если диапазон больше 92 дней — `to` обрезается до `from + 92d`.

**Response 200:**
```json
{
  "from": "2026-05-01",
  "to": "2026-05-31",
  "defaultSchedule": {
    "id": "uuid",
    "name": "Стандартный",
    "type": "Standard",
    "shiftStart": "09:00",
    "shiftEnd": "18:00",
    "color": "#6366f1"
  },
  "days": [
    {
      "date": "2026-05-01",
      "scheduleId": "uuid",
      "scheduleName": "Стандартный",
      "shiftStart": "09:00",
      "shiftEnd": "18:00",
      "color": "#6366f1",
      "isDayOff": false,
      "leaveType": null,
      "leaveStatus": null
    }
  ]
}
```

`leaveType` / `leaveStatus` заполняются только для дат, попадающих в активный отпуск (статусы `Pending` или `Approved`).

---

## Заявки на корректировку

### GET /api/self-service/requests

Список заявок текущего сотрудника (последние 50, по убыванию даты).

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

**Значения `type`:** `CheckIn` | `CheckOut` | `Absence` | `Vacation` | `Overtime` | `Correction`

**Значения `status`:** `Pending` | `Approved` | `Rejected`

---

### POST /api/self-service/requests

Создать заявку.

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
| `type` | да | `CheckIn`, `CheckOut`, `Absence`, `Vacation`, `Overtime`, `Correction` |
| `requestedTimeUtc` | да | Время события (ISO 8601) |
| `requestedEndTimeUtc` | нет | Конец периода (для `Absence` / `Vacation` / `Overtime`) |
| `comment` | нет | Комментарий |
| `latitude` | нет | Широта (для геопроверки) |
| `longitude` | нет | Долгота (для геопроверки) |

**Автоматическое одобрение:** если тип `CheckIn`/`CheckOut` и координаты попадают в радиус активной геозоны — заявка автоматически получает статус `Approved` и создаётся `AttendanceCorrection`.

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

**Response 400:** `{ "message": "Invalid request type." }`

---

### DELETE /api/self-service/requests/{id}

Отменить собственную заявку, пока она в `Pending`. Одобренные / отклонённые трогать нельзя.

**Response 204** — отменена.
**Response 404** — заявка не найдена либо принадлежит другому сотруднику.
**Response 400** — `{ "message": "Only pending requests can be cancelled." }`

---

## Отпуска

### GET /api/self-service/leaves

Последние 100 отпусков сотрудника.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "leaveType": "Vacation",
    "isPaid": true,
    "startDate": "2026-06-01",
    "endDate": "2026-06-14",
    "reason": "Отпуск",
    "status": "Pending",
    "notes": null,
    "createdUtc": "2026-05-20T10:00:00Z",
    "approvedAt": null
  }
]
```

`leaveType`: `Vacation` | `DayOff`. `status`: `Pending` | `Approved` | `Rejected` | `Cancelled`.

---

### POST /api/self-service/leaves

Подать запрос на отпуск. Создаётся в `Pending`, менеджерам уходит уведомление `ApprovalRequest`.

**Request body:**
```json
{
  "leaveType": "Vacation",
  "isPaid": true,
  "startDate": "2026-06-01",
  "endDate": "2026-06-14",
  "reason": "Отпуск"
}
```

| Поле | Обязательно | Описание |
|------|------------|----------|
| `leaveType` | да | `Vacation` или `DayOff` |
| `isPaid` | да | Оплачиваемый или нет |
| `startDate` | да | Дата начала (`YYYY-MM-DD`) |
| `endDate` | да | Дата конца (`YYYY-MM-DD`), `>= startDate` |
| `reason` | нет | Причина |

**Response 201:**
```json
{
  "id": "uuid",
  "leaveType": "Vacation",
  "isPaid": true,
  "startDate": "2026-06-01",
  "endDate": "2026-06-14",
  "reason": "Отпуск",
  "status": "Pending"
}
```

**Response 400:**
- `{ "message": "Invalid leaveType. Use Vacation or DayOff." }`
- `{ "message": "endDate must be >= startDate." }`

---

### DELETE /api/self-service/leaves/{id}

Отменить собственный отпуск, пока он в `Pending`. Меняет статус на `Cancelled` (физически не удаляется — нужно для аудита и календаря).

**Response 204** — отменён.
**Response 404** — отпуск не найден либо принадлежит другому сотруднику.
**Response 400** — `{ "message": "Only pending leaves can be cancelled." }`

---

## Расчётный лист

### GET /api/self-service/payroll

Расчётные строки сотрудника по всем периодам в статусе `Approved` или `Paid` (Draft/Calculated скрыты — это рабочие черновики HR).

**Response 200:**
```json
[
  {
    "id": "uuid",
    "periodId": "uuid",
    "year": 2026,
    "month": 5,
    "startDate": "2026-05-01",
    "endDate": "2026-05-31",
    "periodStatus": "Paid",
    "workedDays": 21,
    "workedHours": 168.0,
    "overtimeHours": 4.5,
    "latenessMinutes": 12.0,
    "earlyLeaveMinutes": 0.0,
    "absentDays": 0,
    "basePay": 1500.00,
    "overtimePay": 50.00,
    "allowancesTotal": 100.00,
    "bonusesTotal": 0.00,
    "grossPay": 1650.00,
    "deductionsTotal": 10.00,
    "latenessDeduction": 10.00,
    "earlyLeaveDeduction": 0.00,
    "taxRate": 0.14,
    "taxAmount": 231.00,
    "netPay": 1409.00,
    "status": "Approved"
  }
]
```

Сортировка: новые периоды сверху.

---

## Уведомления

### GET /api/self-service/notifications

Последние 50 уведомлений (личные + broadcast).

**Response 200:**
```json
[
  {
    "id": "uuid",
    "type": "ApprovalApproved",
    "title": "Leave approved",
    "body": "Your vacation request was approved.",
    "isRead": false,
    "createdAtUtc": "2026-05-20T11:00:00Z",
    "referenceId": "uuid",
    "isBroadcast": false
  }
]
```

### GET /api/self-service/notifications/unread-count

```json
{ "count": 3 }
```

### POST /api/self-service/notifications/{id}/read

**Response 204** — помечено прочитанным.

### POST /api/self-service/notifications/read-all

**Response 204** — все уведомления пользователя помечены прочитанными.

---

## Геозоны

### GET /api/self-service/geo-zones

Активные геозоны — для отрисовки на карте и предварительной проверки «попадаю/не попадаю» до отправки check-in.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Офис",
    "latitude": 40.4093,
    "longitude": 49.8671,
    "radiusMeters": 100
  }
]
```

Эндпоинт возвращает только `IsActive = true`; полный CRUD доступен только админу через `/api/geo-zones/*`.
