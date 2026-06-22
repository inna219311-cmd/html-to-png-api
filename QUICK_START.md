# 🚀 Быстрый старт Railway API (5 минут)

## Шаг 1: Подготовка файлов

```bash
# Распаковка архива
tar -xzf railway_service.tar.gz
cd railway_service
```

Или если скопируешь файлы вручную:
```
railway_service/
├── package.json
├── server.js
├── .env.example
├── .gitignore
├── README.md
└── N8N_SETUP.md
```

---

## Шаг 2: Создай GitHub репо

1. **Создай новый репо на GitHub:**
   - Название: `html-to-png-api`
   - Private/Public: Public (Railway требует)

2. **Закоммитить файлы:**
   ```bash
   cd railway_service
   git init
   git add .
   git commit -m "Initial commit - HTML to PNG API"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/html-to-png-api.git
   git push -u origin main
   ```

---

## Шаг 3: Развернуть на Railway (2 клика!)

1. **Открой [railway.app](https://railway.app)**
   - Авторизуйся (GitHub или email)

2. **Создай новый проект:**
   - Нажми **New Project**
   - Выбери **Deploy from GitHub**
   - Выбери репо `html-to-png-api`
   - Нажми **Deploy**

3. **Жди деплоя (~2 минуты)**
   - Railway автоматически установит зависимости
   - Запустит приложение
   - Выдаст тебе публичный домен

---

## Шаг 4: Копируй свой домен

В Railway дашборде:
- Нажми на проект
- Скопируй ссылку **Public URL** (типа `https://html-to-png-api-prod.up.railway.app`)

---

## Шаг 5: Тестирование

```bash
# Проверь что API живой
curl https://ТВ​ОЙ_ДОМЕН.up.railway.app/

# Должен вернуться JSON:
# {"status":"ok","message":"HTML to PNG API is running",...}
```

Если работает → **Готово!** 🎉

---

## Шаг 6: Подключи в n8n

В n8n добавь **HTTP Request** ноду:

**Настройки:**
```
Method: POST
URL: https://ТВ​ОЙ_ДОМЕН.up.railway.app/convert
Body (JSON):
{
  "html": "{{ $node[\"Побудова HTML\"].json.html }}"
}
```

Готово! Теперь у тебя есть свой API 🚀

---

## Troubleshooting

### ❌ "GitHub repo not found"
- Убедись что репо **Public** (Settings → Visibility)
- Переавторизуйся в Railway

### ❌ "Deployment failed"
- Открой **Logs** в Railway → читай ошибку
- Вероятно: проблема с package.json
- Переделай согласно инструкции выше

### ❌ "413 Payload too large"
- Твой HTML > 10MB
- Решение: уменьши размер или используй `/convert-file`

### ✅ API работает но медленно
- Railway Free tier имеет лимиты
- Платный: $5/мес → 2GB памяти → в 5 раз быстрее

---

## 📊 После деплоя

**Бесплатный план Railway включает:**
- 500 часов процессорного времени в месяц
- 100GB исходящего трафика
- 5 проектов
- Публичный домен

**Для 1000 генераций каруселей в месяц:**
- ~10 часов процессорного времени
- Умещается в бесплатном плане ✓

---

## 🎯 Следующие шаги

1. **Интегрируй в n8n** (см. N8N_SETUP.md)
2. **Добавь твои шаблоны** (carousel + diary code)
3. **Настрой автопубликацию** в социальные сети
4. **Продавай клиентам** как сервис 💰

---

## 💡 Tips

- Сохрани свой домен Railway где-то (используешь везде)
- Если нужна защита API → добавь API Key в server.js (строка ~45)
- Батч-запросы (`/batch`) экономят ресурсы на каруселях из 6+ слайдов

---

**Всё готово к работе!** Дальше интегрируй в n8n. 🚀
