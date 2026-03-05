# Реверс-инжиниринг SADP (Search Active Device Protocol)

## Обзор

SADP — утилита Hikvision для поиска и управления IP-устройствами (камеры, DVR, NVR) в локальной сети. Протокол основан на **UDP multicast/broadcast** и похож на SSDP/UPnP.

---

## Архитектура поиска устройств

### Три канала обнаружения (из Sadp.dll)

Программа использует **4 параллельных механизма** поиска:

| Канал                  | Описание                                   | Компонент                  |
| ---------------------- | ------------------------------------------ | -------------------------- |
| **1. Multicast**       | Multicast-рассылка в сеть                  | `m_IoMulticast`            |
| **2. Multicast Local** | Локальный multicast                        | `m_IoMulticastLocal`       |
| **3. UDP Subnet**      | Broadcast в конкретную подсеть             | `m_IoUdpSubnet`            |
| **4. PCAP**            | Пассивный перехват пакетов (WinPcap/Npcap) | `Packet.dll` + `wpcap.dll` |

При инициализации (`CSadpService::Start`) запускаются потоки:

- `Multicast HPR_Thread` — обработка multicast
- `Multicast Local HPR_Thread` — локальный multicast
- `Udp Subnet HPR_Thread` — broadcast по подсетям
- `PCAP HPR_Thread` — прослушивание через libpcap

---

## Сетевые параметры

### Multicast-адреса (из Sadp.dll)

- **239.255.255.250** — основной multicast (SSDP-подобный)
- **239.255.255.251** — альтернативный (Dahua)

### Порты

- **37020** — UDP порт для Hikvision SADP
- **37809/37810** — Dahua

### Конфигурация (HCSadpSDK.xml)

```xml
<multicast>true</multicast>     <!-- Включить multicast -->
<pcap>true</pcap>              <!-- Включить перехват пакетов -->
<checkIP>true</checkIP>         <!-- Проверка изменения IP -->
<checkIPInterval>5</checkIPInterval>  <!-- Интервал проверки (сек) -->
<timeout>10</timeout>          <!-- Таймаут операций (сек) -->
<pcapPath>wpcap.dll</pcapPath>  <!-- WinPcap или Npcap -->
```

---

## Формат протокола

### Запрос поиска (Probe)

**XML-формат** (извлечён из Sadp.dll):

```xml
<?xml version="1.0" encoding="utf-8"?>
<Probe>
  <Uuid>UUID-СТРОКА</Uuid>
  <MAC>MAC-АДРЕС</MAC>   <!-- опционально -->
  <Types>inquiry</Types>  <!-- или inquiry_v32 -->
</Probe>
```

- **Uuid** — UUID v4, uppercase
- **MAC** — опционально, для поиска в подсети
- **Types** — `inquiry` или `inquiry_v32`

---

## Ключевые функции (из Sadp.dll)

| Функция                             | Назначение                           |
| ----------------------------------- | ------------------------------------ |
| `SADP_SendInquiry`                  | Отправить multicast/broadcast запрос |
| `SADP_InquirySpecificSubnet`        | Поиск в конкретной подсети           |
| `CSADPGlobalCtrl::SearchDevice`     | Поиск по MAC                         |
| `CSADPGlobalCtrl::SearchDeviceBySN` | Поиск по серийному номеру            |
| `CSadpService::ProcessUdpData`      | Разбор входящих UDP-пакетов          |

---

## Алгоритм поиска

1. **Init** — загрузка адаптеров, инициализация OpenSSL
2. **Start** — для каждого адаптера: multicast + UDP subnet + PCAP
3. **SADP_SendInquiry** — рассылка XML Probe
4. Устройства отвечают XML (IP, MAC, SerNum, порты)
5. **LocalCheckIPThread** — проверка каждые checkIPInterval сек
6. **LocalSendInquiryThread** — повторные запросы к известным устройствам

---

## Минимальный Python-пример

```python
import socket
import uuid

MULTICAST_ADDR = "239.255.255.250"
PORT = 37020

def create_probe():
    uid = str(uuid.uuid4()).upper()
    return f'<?xml version="1.0" encoding="utf-8"?><Probe><Uuid>{uid}</Uuid><Types>inquiry</Types></Probe>'

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind(('', PORT))
mreq = socket.inet_aton(MULTICAST_ADDR) + socket.inet_aton('0.0.0.0')
sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
sock.sendto(create_probe().encode('utf-8'), (MULTICAST_ADDR, PORT))
# Приём ответов...
```

---

## Ссылки

- [sadpTool (Go)](https://github.com/saiyan86/sadpTool) — открытая реализация
- Port 37020 — UDP, Hikvision SADP

---

## Активация неактивного устройства

Последовательность вызовов (из Sadp.dll):

| Этап | Функция | Описание |
|------|---------|----------|
| 1 | `SADP_ActivateDevice` | Входная точка активации (серийный номер, пароль) |
| 2 | `CSadpService::GetExchangeCode` / `getencryptstring` | Запрос EncryptString у устройства |
| 3 | `CMulticastProtocol::EncryptPWByRandomStr` | Расшифровка RandomStr, шифрование пароля |
| 4 | `CMulticastProtocol::PackageActivate` | Формирование XML activate |
| 5 | `CSadpService::ActiveDev` | Отправка activate на устройство |
| 6 | `CSADPGlobalCtrl::ParseDevResponse` | Разбор ответа устройства |

### Шаг 1: getencryptstring

Запрос:

```xml
<?xml version="1.0" encoding="utf-8"?>
<Probe>
  <Uuid>UUID</Uuid>
  <MAC>MAC-АДРЕС-УСТРОЙСТВА</MAC>
  <Types>getencryptstring</Types>
</Probe>
```

Устройство отвечает ProbeMatch с `<EncryptString>` — Base64-строка, содержащая RandomStr, зашифрованный публичным RSA-ключом клиента.

### Шаг 2: Шифрование пароля

Используется функция `EncryptPWByRandomStr`:

1. Клиент расшифровывает EncryptString своим приватным ключом RSA → получает RandomStr
2. Пароль шифруется с помощью RandomStr (AES ECB)
3. Результат кодируется в Base64

**Ошибки из Sadp.dll:**
- `DecryptByPrivateKey error` — не удалось расшифровать EncryptString
- `Password Length error` — неверная длина пароля (обычно 8–32 символа)
- `Empty encrypt string!` — устройство не вернуло EncryptString

### Шаг 3: activate

Запрос:

```xml
<?xml version="1.0" encoding="utf-8"?>
<Probe>
  <Uuid>UUID</Uuid>
  <MAC>MAC-АДРЕС-УСТРОЙСТВА</MAC>
  <Types>activate</Types>
  <!-- или activate_v31 -->
  <Password>BASE64_ЗАШИФРОВАННЫЙ_ПАРОЛЬ</Password>
</Probe>
```

Поле `<Password>` содержит пароль, зашифрованный через EncryptPWByRandomStr.

### Возможные ответы устройства (ParseDevResponse)

| Сообщение | Значение |
|-----------|----------|
| Succ! | Активация успешна |
| Has activated! | Устройство уже активировано |
| No activated! | Устройство не активировано (ожидается activate) |
| Password error! | Ошибка пароля |
| Risk password! | Слабый пароль |
| Device deny! | Устройство отклонило запрос |
| Device lock! | Устройство заблокировано |
| Empty encrypt string! | Пустой EncryptString (ошибка 2022) |
| Export file overdue! | Файл сброса просрочен (48 часов) |

### Шифрование (из Sadp.dll)

- **RSA** — для обмена ключами (`GetRsaPublicKey1024`, `RsaDecryptByPrivateKey`)
- **AES ECB** — для шифрования данных (`AesEcbEncrypt`, `AesEcbDecrypt`)
- **Base64** — кодирование зашифрованных данных

### Требования к паролю

- Минимум 8 символов
- Рекомендуется: заглавные, строчные, цифры, спецсимволы

### Конфигурация ActivateBindIp

Если backend в Docker/WSL — пакеты идут с виртуального интерфейса (172.x), а устройство в другой подсети (192.x). Укажите IP вашего ПК в подсети устройства:

```json
"Sadp": {
  "ActivateBindIp": "192.0.0.1"
}
```

(Замените на реальный IP вашего ПК в подсети устройства, например 192.0.0.10.)

### Конфигурация RSA-ключа

Для шифрования пароля нужен приватный RSA-ключ из Sadp.dll (`RsaDecryptByPrivateKey`). В `appsettings.json`:

```json
"Sadp": {
  "ActivateRsaPrivateKeyPath": "путь/к/rsa_private.pem"
}
```

Если ключ не задан — используется plain password (fallback для старых устройств).

### Важные моменты

- EncryptString — **одноразовый**: после использования для activate его нельзя применять повторно.
- Ошибка 2022 («The encrypted string is empty») — обычно из‑за просроченного или невалидного EncryptString.
- Сброс пароля — отдельный протокол (ExportGUID, reset, MailReset, GUIDReset и т.п.), с экспортом XML и участием поддержки Hikvision.
- Сеть — устройство и ПК с SADP должны быть в одной подсети.