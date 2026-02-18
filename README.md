# projectx

# 🎯 1 Ay üçün MVP Məqsədi

Sistem aşağıdakı funksiyaları yerinə yetirməlidir:

🔎 LAN daxilində Access Controller və Intercom axtarışı

➕ Qurğular üçün CRUD əməliyyatları

📡 Qurğuların statusunun real-time monitorinqi

🚪 Qapıların real vaxt rejimində idarə olunması

📥 Hadisələrin real vaxt rejimində qəbul edilməsi

👤 İşçilər və ziyarətçilər üçün CRUD əməliyyatları

🪪 Kartlar / barmaq izi / üz məlumatları üçün CRUD əməliyyatları

🔐 Giriş səviyyələri (Access Level) üçün CRUD əməliyyatları

⏱ Time Attendance (xam məlumatların toplanması və hesablanması)

💰 Payroll (əsas maaş hesablanması)

🗄 PostgreSQL server ilə birlikdə quraşdırılmalıdır

🖥 Backend həm Windows, həm də Linux üzərində işləməlidir


---

# 🏗 Ümumi Arxitektura

## Backend

- ASP.NET Core Web API
- Hikvision SDK (birbaşa C# üzərindən P/Invoke və ya rəsmi .NET wrapper vasitəsilə)
- PostgreSQL
- Background Services (Hosted Services)
- Real-time üçün WebSocket / SignalR


## Frontend

- React + Vite
- SignalR klienti
- Role-based UI (rol əsaslı interfeys)
- Role-based UI (rol əsaslı interfeys)
