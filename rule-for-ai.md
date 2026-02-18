# İİ AGENTLƏR ÜÇÜN VAHİD QAYDA

## ❗ İİ agentlər aşağıdakıları YARATMAMALIDIR:

- .md fayllar
- test faylları
- nümunə (example) fayllar
- müvəqqəti (temporary) fayllar

---

## 📖 Dəyişiklik etməzdən əvvəl:

İİ agent mütləq:

- Layihənin bütün sənədlərini oxumalıdır
- Mövcud arxitekturanı analiz etməlidir
- Mövcud interfeysləri yoxlamalıdır
- Modullar arasındakı asılılıqları araşdırmalıdır

---

## 🎯 Vahid kod üslubuna riayət edilməlidir:

- Clean Architecture istifadə olunmalıdır
- Dependency Injection tətbiq edilməlidir
- static servislərdən istifadə qadağandır
- Loglama Serilog vasitəsilə aparılmalıdır
- Mümkün olan hər yerdə async/await istifadə olunmalıdır
- Vahid adlandırma qaydalarına riayət edilməlidir

---

## 🚫 Qadağandır:

- IP ünvanları, şifrələr və konfiqurasiyaları hardkod etmək
- SDK-nı birbaşa controller-lərdən çağırmaq
- Biznes məntiqini təkrarlamaq
- Arxitektura qatlarını bypass etmək
- Layihənin ümumi strukturunu anlamadan dəyişiklik etmək

---

## 🧠 Hər bir dəyişiklik:

- Geri uyğun (backward compatible) olmalıdır
- Mövcud API kontraktını pozmamalıdır
- Cari arxitekturanı zədələməməlidir
- Layihənin ümumi strategiyasına uyğun olmalıdır



# ЕДИНОЕ ПРАВИЛО ДЛЯ ИИ АГЕНТОВ

## ❗ AI агенты обязаны НЕ создавать:

- .md файлы
- тестовые файлы
- примеры
- временные файлы

---

## 📖 Перед внесением изменений:

AI агент обязан:

- Читать всю документацию проекта
- Анализировать текущую архитектуру
- Проверять существующие интерфейсы
- Изучать зависимости между модулями

---

## 🎯 Соблюдать единый стиль разработки:

- Использовать Clean Architecture
- Применять Dependency Injection
- Не использовать static сервисы
- Использовать логирование через Serilog
- Применять async/await везде, где это возможно
- Соблюдать единые правила именования

---

## 🚫 Запрещено:

- Хардкодить IP-адреса, пароли и конфигурации
- Делать прямые вызовы SDK из контроллеров
- Дублировать бизнес-логику
- Обходить слои архитектуры
- Вносить изменения без понимания общей структуры проекта

---

## 🧠 Любое изменение:

- Должно быть обратно совместимым
- Не должно ломать существующий API контракт
- Не должно нарушать текущую архитектуру
- Должно соответствовать общей стратегии проекта
