# Структура ответа UserInfo Search (Hikvision ISAPI)

`POST /ISAPI/AccessControl/UserInfo/Search?format=json` или `?format=xml`

**userType** — строка: **"normal"**, **"visitor"**, **"blackList"** (не число).

---

## Реальный ответ с устройства

```json
{
  "UserInfo": [{
    "employeeNo": "2",
    "name": "test wow",
    "userType": "normal",
    "onlyVerify": false,
    "closeDelayEnabled": false,
    "Valid": {
      "enable": true,
      "beginTime": "2026-03-12T00:00:00",
      "endTime": "2026-03-31T23:59:59",
      "timeType": "local"
    },
    "belongGroup": "",
    "password": "",
    "doorRight": "1",
    "RightPlan": [{ "doorNo": 1, "planTemplateNo": "1" }],
    "maxOpenDoorTime": 0,
    "openDoorTime": 0,
    "roomNumber": 0,
    "floorNumber": 0,
    "localUIRight": false,
    "gender": "male",
    "numOfCard": 0,
    "numOfRemoteControl": 0,
    "numOfFace": 0,
    "PersonInfoExtends": [{ "value": "" }]
  }]
}
```

---

## JSON (format=json) — варианты обёртки

### Вариант 1: UserInfoSearch → UserInfo (массив или объект)

```json
{
  "UserInfoSearch": {
    "UserInfo": [
      {
        "employeeNo": "000001",
        "name": "Иван Иванов",
        "givenName": "Иван",
        "familyName": "Иванов",
        "type": 1,
        "userType": "normal",
        "gender": "male",
        "Valid": {
          "enable": true,
          "beginTime": "2025-01-01T00:00:00",
          "endTime": "2037-12-31T23:59:59",
          "timeType": "local"
        }
      },
      {
        "employeeNo": "000002",
        "name": "Петр Петров",
        "givenName": "Петр",
        "familyName": "Петров",
        "type": 2,
        "userType": "visitor",
        "Valid": {
          "beginTime": "2025-03-01T00:00:00",
          "endTime": "2025-03-15T23:59:59"
        }
      }
    ]
  }
}
```

### Вариант 2: UserInfoSearch → UserInfoList

```json
{
  "UserInfoSearch": {
    "UserInfoList": [
      {
        "employeeNo": "000001",
        "name": "Иван Иванов",
        "type": 1,
        "userType": "normal"
      }
    ]
  }
}
```

### Вариант 3: UserInfoSearchResult

```json
{
  "UserInfoSearchResult": {
    "UserInfo": [
      {
        "employeeNo": "000001",
        "name": "Иван Иванов",
        "givenName": "Иван",
        "familyName": "Иванов",
        "type": 1,
        "userType": "normal",
        "gender": "male",
        "Valid": {
          "beginTime": "2025-01-01T00:00:00",
          "endTime": "2037-12-31T23:59:59"
        }
      }
    ]
  }
}
```

---

## XML (format=xml)

### Пример структуры

```xml
<?xml version="1.0" encoding="UTF-8"?>
<UserInfoSearch xmlns="http://www.isapi.org/ver20/XMLSchema">
  <UserInfo>
    <employeeNo>000001</employeeNo>
    <name>Иван Иванов</name>
    <givenName>Иван</givenName>
    <familyName>Иванов</familyName>
    <type>1</type>
    <userType>normal</userType>
    <gender>male</gender>
    <Valid>
      <enable>true</enable>
      <beginTime>2025-01-01T00:00:00</beginTime>
      <endTime>2037-12-31T23:59:59</endTime>
      <timeType>local</timeType>
    </Valid>
  </UserInfo>
  <UserInfo>
    <employeeNo>000002</employeeNo>
    <name>Петр Петров</name>
    <type>2</type>
    <userType>visitor</userType>
  </UserInfo>
</UserInfoSearch>
```

---

## Поля UserInfo

| Поле | Тип | Описание |
|------|-----|----------|
| `employeeNo` | string | Уникальный ID пользователя (до 32 байт), **обязательно** |
| `name` | string | Полное имя |
| `givenName` | string | Имя |
| `familyName` | string | Фамилия |
| `type` | int | 1=normal, 2=visitor, 3=blackList (числовой статус) |
| `userType` | string | **"normal"**, **"visitor"**, **"blackList"** (строка) |
| `gender` | string | "male", "female", "unknown" |
| `Valid` | object | Период действия |
| `Valid.beginTime` | string | Начало (yyyy-MM-ddTHH:mm:ss) |
| `Valid.endTime` | string | Конец (yyyy-MM-ddTHH:mm:ss) |
| `Valid.enable` | bool | Включена ли проверка периода |
| `Valid.timeType` | string | "local" или "utc" |

---

## Как получить ответ

```powershell
.\scripts\fetch-device-users-raw.ps1 -Email "ваш_email" -Password "ваш_пароль" -Format xml
```

Или JSON:

```powershell
.\scripts\fetch-device-users-raw.ps1 -Email "ваш_email" -Password "ваш_пароль" -Format json
```
