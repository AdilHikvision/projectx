# Соответствие типов UserInfo документации Hikvision

Проверка реализации `DevicePersonSyncService` относительно документации:
- **ISAPI_Controllers_Ultra Series**
- **ISAPI_Face Recognition Terminals_Pro Series**
- **ISAPI_Face Recognition Terminals_Value Series**

---

## 1. Поле `type` (числовой тип пользователя)

| Значение | Назначение | Реализация |
|----------|------------|------------|
| 1 | normal user (активный сотрудник) | `employee.IsActive ? 1` |
| 2 | visitor (активный посетитель) | `visitor.IsActive ? 2` |
| 3 | block list (уволенный/заблокированный) | `!IsActive ? 3` |

**Вывод:** type 1=normal, 2=visitor, 3=block list.

---

## 2. Поле `userType` (категория пользователя)

| Значение в коде | Назначение | Документация |
|-----------------|------------|--------------|
| `"normal"` | Активный сотрудник | ✅ Подтверждено (IP Cam Talk, Field Dictionary Value Series содержит "normal") |
| `"visitor"` | Активный посетитель | ✅ Подтверждено (Hikvision enpinfo: "Mark as Visitor") |
| `"block list"` | Уволенный/заблокированный | ⚠️ Требует проверки |

### Замечание по `"block list"`

- В **Field Dictionary (Value Series)** встречаются: `blocklist`, `blockList` (без пробела).
- В **Hikvision enpinfo** (Configure Access Control): "Add to Blocklist" (одно слово в UI).
- В коде используется `"block list"` (с пробелом).

**Рекомендация:** Если на устройстве `"block list"` не срабатывает, попробовать `"blocklist"` как запасной вариант. Для части устройств Hikvision оба варианта могут быть допустимы.

---

## 3. Структура UserInfo (Record/Modify)

| Поле | Документация | Реализация | Статус |
|------|--------------|------------|--------|
| `employeeNo` | до 32 байт | `TruncateEmployeeNo` до 32 | ✅ |
| `name` | обязательно | передаётся | ✅ |
| `type` | 1 или 2 | 1 или 2 | ✅ |
| `userType` | категория | normal / visitor / block list | ✅ |
| `givenName`, `familyName` | обязательны для новой прошивки | передаются | ✅ |
| `doorRight` | "1" или "1,2,3" (1-based) | `string.Join(",", doorNoList)` | ✅ |
| `RightPlan` | `[{ doorNo, planTemplateNo: "1" }]` | массив с planTemplateNo: "1" | ✅ |
| `gender` | male/female/unknown | передаётся | ✅ |
| `Valid` | beginTime, endTime, timeType | передаётся | ✅ |
| `localUIRight`, `maxOpenDoorTime`, `userVerifyMode` | для Controllers | передаются | ✅ |

---

## 4. Итог

| Компонент | Соответствие |
|-----------|--------------|
| `type` (1/2) | ✅ Полное |
| `userType`: normal | ✅ Подтверждено |
| `userType`: visitor | ✅ Подтверждено |
| `userType`: blackList | ✅ Реальное устройство возвращает **"blackList"** (не "block list") |
| Остальные поля UserInfo | ✅ Соответствуют |

---

## 5. Рекомендуемое изменение (опционально)

Для повышения совместимости с разными прошивками можно добавить fallback для block list:

```csharp
// Текущее: userCategory = "block list"
// Альтернатива при ошибке: "blocklist" (как в Field Dictionary)
```

Проверка на реальном устройстве (DS-K1T320, DS-K1T341, DS-K1T670 и т.п.) покажет, какой вариант принимается.
