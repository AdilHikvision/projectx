# Backend API

## Base URL

- `http://localhost:5154`
- `https://localhost:7055`

## Аутентификация

- Используется JWT Bearer токен.
- Для защищенных endpoint передавайте заголовок:
  - `Authorization: Bearer <accessToken>`

## Endpoints

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
