# ISAPI Access Control API Reference
## Извлечено из документации Hikvision Face Recognition Terminals (Pro Series & Value Series)

---

## 1. Person/UserInfo API

### Пути и HTTP методы

| Операция | Метод | URL |
|----------|-------|-----|
| **Capabilities** | GET | `/ISAPI/AccessControl/UserInfo/capabilities?format=json` |
| **Count** (кол-во пользователей) | GET | `/ISAPI/AccessControl/UserInfo/Count?format=json` |
| **Search** (поиск) | POST | `/ISAPI/AccessControl/UserInfo/Search?format=json` |
| **SetUp** (применить/обновить) | PUT | `/ISAPI/AccessControl/UserInfo/SetUp?format=json` |
| **Record** (добавить) | POST | `/ISAPI/AccessControl/UserInfo/Record?format=json` |
| **Modify** (редактировать) | PUT | `/ISAPI/AccessControl/UserInfo/Modify?format=json` |
| **Delete** (удалить) | PUT | `/ISAPI/AccessControl/UserInfoDetail/Delete?format=json` |
| **Delete Progress** | GET | `/ISAPI/AccessControl/UserInfoDetail/DeleteProcess` |

### Проверка поддержки
- **Person Management**: `GET /ISAPI/AccessControl/capabilities` → `isSupportUserInfo: true`
- **Person Delete**: `isSupportUserInfoDetailDelete: true`

### Формат
- **Request/Response**: JSON (`?format=json`)
- **Person ID**: `employeeNo` — уникальный идентификатор (до 32 байт)
- **UserInfo/Record** (POST) — для Face Recognition Terminals и Controllers:
  - `employeeNo`, `name`, `type` (1=активен, 2=неактивен)
  - `userType`, `givenName`, `familyName` — имя и фамилия (обязательны для новой прошивки)
  - `doorRight` — строка: `"1"` или `"1,2,3"` (номера дверей 1-based)
  - **RightPlan** — обязателен (иначе MessageParametersLack): массив `[{ doorNo, planTemplateNo: "1" }]`
  - `localUIRight`, `maxOpenDoorTime`, `userVerifyMode` — для совместимости с Controllers

---

## 2. Card API

### Пути и HTTP методы

| Операция | Метод | URL |
|----------|-------|-----|
| **Capabilities** | GET | `/ISAPI/AccessControl/CardInfo/capabilities?format=json` |
| **Count** (кол-во карт) | GET | `/ISAPI/AccessControl/CardInfo/Count?format=json` |
| **Count by person** | GET | `/ISAPI/AccessControl/CardInfo/Count?format=json&employeeNo=<employeeNo>` |
| **Search** (поиск) | POST | `/ISAPI/AccessControl/CardInfo/Search?format=json` |
| **SetUp** (применить/обновить) | PUT | `/ISAPI/AccessControl/CardInfo/SetUp?format=json` |
| **Record** (добавить) | POST | `/ISAPI/AccessControl/CardInfo/Record?format=json` |
| **Modify** (редактировать) | PUT | `/ISAPI/AccessControl/CardInfo/Modify?format=json` |
| **Delete** (удалить) | PUT | `/ISAPI/AccessControl/CardInfo/Delete?format=json` |
| **Capture** (считать карту) | GET | `/ISAPI/AccessControl/CaptureCardInfo?format=json` |

### Проверка поддержки
- **Card Management**: `GET /ISAPI/AccessControl/capabilities` → `isSupportCardInfo: true`
- **Card Capture**: `isSupportCaptureCardInfo: true`

### Формат
- **Request/Response**: JSON
- **Response fields**: `cardNo`, `cardNumber`, `employeeNo`

---

## 3. Face API

### Пути и HTTP методы

| Операция | Метод | URL |
|----------|-------|-----|
| **FDLib Capabilities** | GET | `/ISAPI/Intelligent/FDLib/capabilities?format=json` |
| **FDLib List** | GET | `/ISAPI/Intelligent/FDLib?format=json` |
| **Create FDLib** | POST | `/ISAPI/Intelligent/FDLib?format=json` |
| **Delete FDLib (all)** | DELETE | `/ISAPI/Intelligent/FDLib?format=json` |
| **Count** | GET | `/ISAPI/Intelligent/FDLib/Count?format=json` |
| **Count by FDID** | GET | `/ISAPI/Intelligent/FDLib/Count?format=json&FDID=<FDID>&faceLibType=<faceLibType>` |
| **Search** | POST | `/ISAPI/Intelligent/FDLib/FDSearch?format=json` |
| **SetUp** (применить) | PUT | `/ISAPI/Intelligent/FDLib/FDSetUp?format=json` |
| **Add Face (with image)** | POST | `/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json` |
| **Picture Upload** (multipart) | POST | `/ISAPI/Intelligent/FDLib/pictureUpload` |
| **Modify** | PUT | `/ISAPI/Intelligent/FDLib/FDModify?format=json` |
| **Delete** | PUT | `/ISAPI/Intelligent/FDLib/FDSearch/Delete?format=json&FDID=<FDID>&faceLibType=<FDType>` |
| **Capture Face** | POST | `/ISAPI/AccessControl/CaptureFaceData` |
| **Capture Progress** | GET | `/ISAPI/AccessControl/CaptureFaceData/Progress` |

### Добавление лица с изображением (multipart/form-data)

```
POST /ISAPI/Intelligent/FDLib/pictureUpload
Content-Type: multipart/form-data; boundary=<boundary>

--<boundary>
Content-Disposition: form-data; name="PictureUploadData";
Content-Type: application/xml
Content-Length: <length>
<PictureUploadData/>
--<boundary>
Content-Disposition: form-data; name="face_picture"; filename="face_picture.jpg";
Content-Type: image/jpeg
Content-Length: <length>
[Picture Data]
--<boundary>--
```

### FDID (Face Library ID)
- **FDID=1**: видимый свет (visible light)
- **FDID=2**: инфракрасный свет (infrared) — для устройств с `deepMode`

### Проверка поддержки
- **Face Management**: `isSupportFDLib: true`
- **Capture Face (visible)**: `isSupportCaptureFace: true`
- **Capture Face (infrared)**: `isSupportCaptureInfraredFace: true`

---

## 4. Fingerprint API

### Пути и HTTP методы

| Операция | Метод | URL |
|----------|-------|-----|
| **Capabilities** | GET | `/ISAPI/AccessControl/FingerPrintCfg/capabilities?format=json` |
| **Count** | GET | `/ISAPI/AccessControl/FingerPrint/Count?format=json` |
| **Count by person** | GET | `/ISAPI/AccessControl/FingerPrint/Count?format=json&employeeNo=<employeeNo>` |
| **Search** | POST | `/ISAPI/AccessControl/FingerPrintUpload?format=json` |
| **SetUp** (применить) | POST | `/ISAPI/AccessControl/FingerPrint/SetUp?format=json` |
| **Add** | POST | `/ISAPI/AccessControl/FingerPrintDownload?format=json` |
| **Add Progress** | GET | `/ISAPI/AccessControl/FingerPrintProgress?format=json` |
| **Modify** | POST | `/ISAPI/AccessControl/FingerPrintModify?format=json` |
| **Delete** | PUT | `/ISAPI/AccessControl/FingerPrint/Delete?format=json` |
| **Delete Progress** | GET | `/ISAPI/AccessControl/FingerPrint/DeleteProcess?format=json` |
| **Capture** | POST | `/ISAPI/AccessControl/CaptureFingerPrint` |

### Проверка поддержки
- **Fingerprint Management**: `isSupportFingerPrintCfg: true`
- **Fingerprint Delete**: `isSupportFingerPrintDelete: true`
- **Fingerprint Capture**: `isSupportCaptureFingerPrint: true`

### Ограничения
- До 10 отпечатков на человека
- Макс. кол-во: `GET /ISAPI/AccessControl/CardReaderCfg/<cardReaderID>?format=json` → `fingerPrintCapacity`

---

## 5. Iris API (только Pro Series)

| Операция | Метод | URL |
|----------|-------|-----|
| **Capabilities** | GET | `/ISAPI/AccessControl/IrisInfo/capabilities?format=json` |
| **Count** | GET | `/ISAPI/AccessControl/IrisInfo/count?format=json` |
| **Search** | POST | `/ISAPI/AccessControl/IrisInfo/search?format=json` |
| **SetUp** | PUT | `/ISAPI/AccessControl/IrisInfo/setup?format=json` |
| **Record** | POST | `/ISAPI/AccessControl/IrisInfo/record?format=json` |
| **Modify** | PUT | `/ISAPI/AccessControl/IrisInfo/modify?format=json` |
| **Delete** | PUT | `/ISAPI/AccessControl/IrisInfo/delete?format=json` |
| **Capture** | POST | `/ISAPI/AccessControl/captureIrisData?format=json` |
| **Capture Progress** | GET | `/ISAPI/AccessControl/captureIrisData/progress?format=json` |

**Поддержка**: `isSupportIrisInfo: true`, `isSupportCaptureIrisData: true`

---

## 6. Различия Pro Series vs Value Series

| Функция | Pro Series | Value Series |
|---------|------------|--------------|
| **Person/UserInfo** | ✅ Идентично | ✅ Идентично |
| **Card** | ✅ Идентично | ✅ Идентично |
| **Face** | ✅ Идентично | ✅ Идентично |
| **Fingerprint** | ✅ Идентично | ✅ Идентично |
| **Iris** | ✅ Поддерживается (раздел 9.13) | ✅ Поддерживается (раздел 9.12) |
| **Нумерация разделов** | 9.16 Person, 9.17 Remote Verification | 9.15 Person, 9.16 Remote Verification |
| **Модели устройств** | DS-K1T605, DS-K1T606, DS-K1T607, DS-K1T642, DS-K1T670, DS-K1T671, DS-K1T673, DS-K1T8105, DS-K1TA70MI-T и др. | DS-K1A330, DS-K1T320, DS-K1T321, DS-K1T331, DS-K1T341, DS-K1T342, DS-K1T343, DS-K1T344, DS-K1T6Q-F20/F21/F22 и др. |

### Вывод
**API-пути и структуры идентичны** для Person, Card, Face и Fingerprint в обеих сериях. Документация Value Series (418 стр.) и Pro Series (382 стр.) описывают одни и те же ISAPI endpoints. Различия — в поддерживаемых моделях устройств и возможных ограничениях конкретных моделей (проверять через `/capabilities`).

---

## 7. Общие замечания

1. **Аутентификация**: Digest Authentication (RFC 7616)
2. **Content-Type**: `application/json; charset="UTF-8"` для JSON, `application/xml` для XML
3. **Базовый URL**: `http(s)://<device_ip>:<port>`
4. **Проверка возможностей**: перед вызовом API проверять `GET /ISAPI/AccessControl/capabilities` и соответствующие `/capabilities` endpoints
5. **Person ID (employeeNo)** — связующее поле для карт, отпечатков, лиц и радужки

## 8. Порты (Pro/Value/Controllers)

- **Порт 80**: HTTP — веб-интерфейс и ISAPI (основной для Face Recognition Terminals)
- **Порт 443**: HTTPS — веб и ISAPI
- **Порт 8000**: SDK (бинарный протокол), **не** HTTP. ISAPI по HTTP использует 80/443.

При настройке устройства: порт 8000 в SADP — для SDK; ISAPI доступен на 80 (HTTP) или 443 (HTTPS). Убедитесь, что HTTP включён в настройках устройства (Configuration → Network → Advanced Settings → Other).
