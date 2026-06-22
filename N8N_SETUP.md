# Интеграция с n8n 🔌

Полная пошаговая инструкция как использовать Railway API в n8n.

---

## Структура воркфлоу

```
[Trigger] 
  ↓
[Побудова HTML слайду] (генерирует HTML)
  ↓
[HTTP Request] (отправляет HTML на API)
  ↓
[Write Binary File] или [Upload to Cloud]
  ↓
[Publish to Social]
```

---

## Шаг 1: Подготовка

1. Разверни API на Railway (см. README.md)
2. Скопируй свой домен: `https://твой-домен.up.railway.app`
3. Тестируй в curl:
   ```bash
   curl https://твой-домен.up.railway.app/
   ```
   Должен вернуться JSON с `"status": "ok"`

---

## Шаг 2: Добавь HTTP Request ноду в n8n

### Создание ноды

1. В твоем n8n воркфлоу нажми **+**
2. Поиск: **HTTP Request**
3. Добавь ноду

### Базовые настройки

| Параметр | Значение |
|----------|----------|
| **Method** | POST |
| **URL** | `https://твой-домен.up.railway.app/convert` |
| **Authentication** | None |
| **Response Format** | JSON |

### Body (JSON mode)

Нажми на вкладку **Body**, выбери **JSON**:

```json
{
  "html": "{{ $node[\"Побудова HTML слайду\"].json.html }}",
  "width": 1080,
  "height": 1080
}
```

**Где:**
- `$node[\"Побудова HTML слайду\"]` — название ноды которая генерирует HTML
- `.json.html` — поле с самим HTML

### Headers (опционально, для логирования)

```
User-Agent: n8n-carousel-bot
```

---

## Шаг 3: Обработка ответа

API вернёт:
```json
{
  "success": true,
  "image": "iVBORw0KGgo...",
  "size": 45234,
  "mimeType": "image/png"
}
```

### Вариант A: Сохранить в файл

Добавь ноду **Write Binary File**:

**Настройки:**
```
File Name: {{ $now }}_carousel.png
Data: {{ $node["HTTP Request"].json.image }}
File Encoding: base64
```

**Путь:** `/tmp/` или используй Google Drive Node

### Вариант B: Загрузить в Google Drive

Добавь ноду **Google Drive**:

**Настройки:**
```
Resource: File
Operation: Upload
File Name: carousel_{{ $now }}.png
Binary Data: {{ $node["HTTP Request"].json.image }}
Encoding: base64
Parent Folder: [твоя папка]
```

### Вариант C: Отправить в Telegram

Добавь ноду **Telegram**:

```
Method: Send Photo
Chat ID: твой_chat_id
Photo URL: [сохранённое изображение]
```

---

## Шаг 4: Полный пример воркфлоу (копипаста)

Если хочешь готовый воркфлоу, используй этот JSON:

```json
{
  "nodes": [
    {
      "parameters": {
        "operation": "executeString",
        "functionCode": "// Генерируем простой HTML для теста\nreturn [{\n  json: {\n    html: '<html><body style=\"background:linear-gradient(135deg,#001f4d,#003d99);width:1080px;height:1080px;display:flex;align-items:center;justify-content:center;color:white;font-family:Arial\"><h1>Мій перший слайд</h1></body></html>'\n  }\n}];"
      },
      "name": "Code (Test HTML)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [250, 250]
    },
    {
      "parameters": {
        "url": "https://твой-домен.up.railway.app/convert",
        "method": "POST",
        "bodyParametersJson": "{\n  \"html\": \"{{ $node[\\\"Code (Test HTML)\\\"].json.html }}\",\n  \"width\": 1080,\n  \"height\": 1080\n}"
      },
      "name": "HTTP Request (API)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [450, 250]
    },
    {
      "parameters": {
        "path": "/tmp/carousel_{{ $now }}.png",
        "dataPropertyName": "image",
        "mode": "base64"
      },
      "name": "Write Binary File",
      "type": "n8n-nodes-base.writeBinaryFile",
      "typeVersion": 1,
      "position": [650, 250]
    }
  ],
  "connections": {
    "Code (Test HTML)": {
      "main": [[{"node": "HTTP Request (API)", "type": "main", "index": 0}]]
    },
    "HTTP Request (API)": {
      "main": [[{"node": "Write Binary File", "type": "main", "index": 0}]]
    }
  }
}
```

Скопируй этот JSON → в n8n нажми **⋮** → **Import from code** → вставь

---

## Шаг 5: Интеграция с твоим кодом каруселей

### Используй это как Template в Code-ноде:

```javascript
// Вход: данные клиента
const client = $input.first().json;

// Подставляем в твой шаблон (из n8n_carousel_code.js)
const html = generateCarousel(client.template, client.theme, {
  destination: client.destination,
  tagline: client.tagline,
  photo: client.photo,
  // ... другие поля
});

// Возвращаем для HTTP запроса
return [{
  json: { html }
}];
```

Потом HTTP Request пошлёт этот HTML на API → получишь PNG.

---

## Шаг 6: Error Handling

Добавь ноду **Switch** после HTTP Request для обработки ошибок:

```
Condition 1: {{ $node["HTTP Request"].json.success }} == true
  → Следующий шаг (сохранить файл)

Condition 2: Default
  → Send Error Notification (Telegram/Email)
```

---

## Шаг 7: Масштабирование (для каруселей из 6 слайдов)

Используй `/batch` эндпоинт для экономии:

**HTTP Request:**
```
Method: POST
URL: https://твой-домен.up.railway.app/batch
Body (JSON):
{
  "items": [
    {"id": "slide_1", "html": "{{ $node['HTML_1'].json.html }}"},
    {"id": "slide_2", "html": "{{ $node['HTML_2'].json.html }}"},
    ...
  ]
}
```

**Ответ:** массив `results` с PNG для каждого слайда сразу.

---

## Debugging

### Если что-то не работает:

1. **Проверь статус API:**
   ```bash
   curl https://твой-домен.up.railway.app/
   ```
   Должно вернуть JSON

2. **Логи на Railway:**
   Зайди в Railway → твой проект → **Logs** → смотри ошибки

3. **Тестируй запрос в Postman:**
   ```
   POST https://твой-домен.up.railway.app/convert
   Body (JSON):
   {
     "html": "<html><body>test</body></html>"
   }
   ```

4. **В n8n: включи Debug mode**
   - Нажми на ноду → **Debug**
   - Посмотри какой JSON приходит от API

---

## ⚡ Performance Tips

1. **Для каруселей из 6 слайдов:** используй `/batch` — в 2 раза быстрее
2. **Шрифты:** всегда Google Fonts (встраиваются автоматически)
3. **Картинки:** HTTPS URLs только, иначе могут не загрузиться
4. **Timeout:** установи в HTTP Request ≥ 30 сек (потому что рендеринг может занять 2-3 сек)

---

## 🎯 Готовые примеры

### Пример 1: Простая публикация в Telegram

```javascript
// После HTTP Request получаем PNG (base64)
// Отправляем в Telegram
```

Используй ноду **Telegram** → **Send Photo** с бинарными данными.

### Пример 2: Публикация каруселя в Instagram

```javascript
// 6 PNG + каптионы
// Создаёшь каруселем в инструменте Instagram
```

Используй **Instagram API** или **Buffer** для автопубликации.

### Пример 3: Сохранение в Google Drive + отправка клиенту

```javascript
// HTTP Request → Google Drive Upload → Telegram/Email с ссылкой
```

---

## 🔗 Итоговая схема для твоего бизнеса

```
[ Новый клиент ] 
  ↓
[ Google Form / Telegram Bot ]
  ↓
[ Сохрани в Google Sheets / MongoDB ]
  ↓
[ n8n trigger (каждый день в 9:00) ]
  ↓
[ Для каждого клиента: ]
  - Загрузи его template + theme из БД
  - Подставь данные тура (фото, название, дату)
  - Генерируй HTML (Code Node с твоим кодом)
  - Отправь на Railway API → получи 6 PNG
  ↓
[ Сохрани в Google Drive / Dropbox ]
  ↓
[ Отправь клиенту ссылку (Telegram / Email) ]
  ↓
[ Клиент может скачать и опубликовать ]
```

---

**Готово!** Тебе хватит? Или нужны ещё примеры? 🚀
