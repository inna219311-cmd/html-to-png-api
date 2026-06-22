# HTML to PNG Converter API 🖼️

Готовый сервис для конвертации HTML → PNG в реальном времени. Развернуться на Railway за 3 минуты.

---

## 🚀 Развертывание на Railway

### Способ 1: Через GitHub (самый простой)

1. **Создай репо на GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/html-to-png-api.git
   git push -u origin main
   ```

2. **Открой [railway.app](https://railway.app)**
   - Нажми **New Project** → **Deploy from GitHub**
   - Выбери репо `html-to-png-api`
   - Railway автоматически:
     - Установит зависимости (`npm install`)
     - Запустит `npm start`
     - Выдаст тебе домен типа `html-to-png-api-prod.up.railway.app`

3. **Проверь статус:**
   ```bash
   curl https://html-to-png-api-prod.up.railway.app/
   ```
   Должен прийти JSON с `"status": "ok"`

### Способ 2: Через Railway CLI (если хочешь локально тестировать)

```bash
# Установи Railway CLI
npm install -g @railway/cli

# Залогинься
railway login

# Инициализируй проект
railway init

# Разверни
railway up
```

---

## 📋 Как использовать в n8n

### 1. Добавь HTTP Request ноду

**Настройки:**

| Параметр | Значение |
|----------|----------|
| **Method** | POST |
| **URL** | `https://твой-домен-на-railway.up.railway.app/convert` |
| **Authentication** | None |

### 2. Заполни Body

Используй **JSON** mode:

```json
{
  "html": "{{ $node[\"Побудова HTML слайду\"].json.html }}",
  "width": 1080,
  "height": 1080
}
```

### 3. Получи ответ

Ответ приходит JSON:
```json
{
  "success": true,
  "image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "size": 45234,
  "mimeType": "image/png"
}
```

### 4. Сохрани в файл

Добавь **Write Binary File** ноду:
```
Path: /tmp/{{ $now }}_carousel.png
Data: {{ $node[\"HTTP Request\"].json.image }} (из Base64)
```

Или используй ноду для загрузки в облако (Google Drive, S3, Telegram и т.д.).

---

## 🔌 Примеры запросов

### Example 1: Конвертировать HTML в Base64 PNG

```bash
curl -X POST https://твой-домен.up.railway.app/convert \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body style=\"background:blue;\"><h1>Hello</h1></body></html>",
    "width": 1080,
    "height": 1080
  }'
```

Ответ:
```json
{
  "success": true,
  "image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "size": 12345
}
```

### Example 2: Получить PNG файл напрямую

```bash
curl -X POST https://твой-домен.up.railway.app/convert-file \
  -H "Content-Type: application/json" \
  -d '{"html": "..."}' \
  --output carousel.png
```

### Example 3: Батч-конвертация (несколько слайдов сразу)

```bash
curl -X POST https://твой-домен.up.railway.app/batch \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": "slide_1", "html": "<html>Слайд 1</html>"},
      {"id": "slide_2", "html": "<html>Слайд 2</html>"},
      {"id": "slide_3", "html": "<html>Слайд 3</html>"}
    ]
  }'
```

Ответ: массив с результатами для каждого слайда.

---

## 🔧 API Документация

### `POST /convert`

Конвертирует один HTML в PNG (Base64).

**Request:**
```json
{
  "html": "<html>...</html>",
  "width": 1080,
  "height": 1080,
  "quality": 95
}
```

**Response:**
```json
{
  "success": true,
  "image": "base64_encoded_png",
  "size": 45234,
  "mimeType": "image/png"
}
```

---

### `POST /convert-file`

Конвертирует HTML в PNG файл (бинарный ответ).

**Request:**
```json
{
  "html": "<html>...</html>",
  "width": 1080,
  "height": 1080
}
```

**Response:** Бинарный PNG (Content-Type: image/png)

---

### `POST /batch`

Конвертирует несколько HTML за раз (экономнее по ресурсам).

**Request:**
```json
{
  "items": [
    {"id": "item_1", "html": "<html>...</html>"},
    {"id": "item_2", "html": "<html>...</html>"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total": 2,
  "successful": 2,
  "results": [
    {"id": "item_1", "success": true, "image": "...", "size": 45234},
    {"id": "item_2", "success": true, "image": "...", "size": 54321}
  ]
}
```

---

## ⚙️ Переменные окружения

| Переменная | По умолчанию | Описание |
|-----------|-------------|---------|
| `PORT` | 3000 | Порт сервера |
| `NODE_ENV` | production | Режим (production/development) |

Railway автоматически устанавливает `PORT` из своей инфраструктуры.

---

## 🐛 Troubleshooting

### Ошибка: "Timeout"
- Возможно, HTML содержит медленно загружающиеся внешние ресурсы
- Решение: подожди пока загрузится или используй `waitUntil: 'load'` вместо `'networkidle'` (редактировать в server.js строка 58)

### Ошибка: "Out of memory"
- Railway Free tier имеет 512 MB памяти
- Решение: используй `/batch` для одновременной обработки нескольких (макс 10 за раз)
- Или обновись до Paid плана ($5/мес → 2GB памяти)

### Шрифты не применяются
- Убедись что в HTML ты загружаешь шрифты через `<link href="https://fonts.googleapis.com/...">`
- Локальные шрифты не работают (нужны URL)

### Картинки не загружаются
- Используй полные URL (https://example.com/image.jpg) вместо относительных путей
- Data URI (base64) работают идеально

---

## 📊 Лимиты и производительность

| Метрика | Лимит |
|---------|-------|
| Максимальный размер HTML | 10 MB |
| Размер ответа Base64 | До 10 MB |
| Одновременные запросы | 1 (Railway Free) |
| Скорость рендеринга | 1-3 сек за слайд |
| Батч-запросы | До 10 за раз |

Railway Free: ~1000 запросов/месяц на бесплатном плане.
Платный: ~50,000+ запросов/месяц ($5/мес).

---

## 🔐 Безопасность

⚠️ **Важно:** Этот API открыт для всех. Если хочешь защиту:

1. **Добавь API Key:**
   ```javascript
   const API_KEY = process.env.API_KEY;
   app.use((req, res, next) => {
     if (req.headers['authorization'] !== `Bearer ${API_KEY}`) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     next();
   });
   ```

2. **В n8n добавь заголовок:**
   ```
   Headers: Authorization: Bearer твой_секретный_ключ
   ```

---

## 📝 Интеграция с n8n (полный пример)

1. **Ноду "Побудова HTML слайду"** → выход: `html` поле
2. **HTTP Request:**
   - Method: POST
   - URL: `https://твой-домен.up.railway.app/convert`
   - Body (JSON): `{ "html": "{{ $node[...].json.html }}" }`
3. **Write Binary File:**
   - Path: `/tmp/{{ $now }}_carousel.png`
   - Data: Base64 из ответа
4. **Отправь в Telegram / Google Drive / S3**

---

## 💡 Tips

- Использование `/batch` экономит память при обработке каруселей (одного браузера на все слайды)
- Картинки в HTML должны загружаться максимум за 2-3 сек, иначе timeout
- Google Fonts работают идеально — используй их для стабильности

---

## 📄 Лицензия

MIT

---

**Вопросы?** Пиши в коде! 🚀
