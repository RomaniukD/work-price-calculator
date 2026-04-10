# Backend API - Price Counter

Бекенд сервіс для системи управління цінами на роботи та послуги. Включає SQLite базу даних, парсер для збору даних з зовнішніх джерел та REST API.

## Характеристики

- **База даних:** SQLite (локальна)
- **API:** Express.js REST API
- **Парсинг:** Cheerio + Axios для збору даних з веб-сайтів
- **Структура:** Категорії → Підкатегорії → Роботи з цінами

## Установка

```bash
npm install
```

## Запуск

### Розробка
```bash
npm run dev
# або
node index.js
```

Сервер запуститься на `http://localhost:3000`

## API Ендпоїнти

### 1. GET `/api/categories`
Повертає всі категорії з підкатегоріями та роботами.

**Приклад відповіді:**
```json
[
  {
    "category": "Оздоблювальні роботи",
    "subcategories": [
      {
        "name": "Фасадні роботи",
        "tasks": [
          { "name": "Штукатурка", "price": 200 },
          { "name": "Фарбування", "price": 150 }
        ]
      }
    ]
  }
]
```

### 2. POST `/api/update-prices`
Запускає парсер для збору даних з іншого сайту та оновлює базу даних.

**Параметри запиту (body):**
```json
{
  "sourceUrl": "https://example.com/prices"
}
```

**Приклад curl:**
```bash
curl -X POST http://localhost:3000/api/update-prices \
  -H "Content-Type: application/json" \
  -d '{"sourceUrl":"https://example.com/prices"}'
```

### 3. POST `/api/update-prices-demo` (для тестування)
Завантажує демо-дані для тестування без реального джерела.

```bash
curl -X POST http://localhost:3000/api/update-prices-demo
```

### 4. GET `/api/health`
Перевірка стану сервера.

```bash
curl http://localhost:3000/api/health
```

## Структура Файлів

```
backend/
├── index.js              # Головний файл сервера
├── api.js                # API маршрути
├── database.js           # Ініціалізація та управління БД
├── parser.js             # Парсер для збору даних
├── package.json          # Залежності
└── prices.db            # SQLite база даних (створюється автоматично)
```

## Схема Бази Даних

### Таблиця `categories`
```sql
- id (INTEGER, PRIMARY KEY)
- name (TEXT, UNIQUE)
- created_at (DATETIME)
```

### Таблиця `subcategories`
```sql
- id (INTEGER, PRIMARY KEY)
- category_id (INTEGER, FOREIGN KEY)
- name (TEXT)
- created_at (DATETIME)
- UNIQUE(category_id, name)
```

### Таблиця `tasks`
```sql
- id (INTEGER, PRIMARY KEY)
- subcategory_id (INTEGER, FOREIGN KEY)
- name (TEXT)
- price (REAL)
- updated_at (DATETIME)
- UNIQUE(subcategory_id, name)
```

## Налаштування Парсера

Парсер у файлі `parser.js` використовує CSS-селектори для витягування даних. Для налаштування під ваш сайт:

1. Відкрийте `parser.js`
2. В функції `parseWebsite()` знайдіть коментар "Template for parsing"
3. Замініть селектори на відповідні для вашого сайту:

```javascript
// Приклад селекторів - налаштуйте для вашого сайту:
$('div.category').each((catIndex, categoryEl) => {
  const categoryName = $(categoryEl).find('h2.category-name').text().trim();
  // ... решта коду
});
```

## Приклади Використання

### Завантажити демо-дані
```bash
curl -X POST http://localhost:3000/api/update-prices-demo
```

### Отримати всі категорії
```bash
curl http://localhost:3000/api/categories
```

### Оновити ціни з вашого сайту
```bash
curl -X POST http://localhost:3000/api/update-prices \
  -H "Content-Type: application/json" \
  -d '{"sourceUrl":"https://your-website.com/prices"}'
```

## Особливості

- ✅ Автоматичне оновлення старих цін
- ✅ Додавання нових робіт
- ✅ Транзакційна обробка даних
- ✅ Обробка помилок мережі
- ✅ CORS включено для фронтенду
- ✅ JSON API

## Залежності

- **express** - Web фреймворк
- **sqlite3** - База даних
- **axios** - HTTP клієнт для завантаження сайтів
- **cheerio** - Парсинг HTML
- **cors** - Cross-Origin Resource Sharing

## Міграція Базиданих

Бази даних автоматично ініціалізується при першому запуску. Якщо потрібно очистити БД:

```bash
rm prices.db
npm run dev
```

## Обмеження та Примітки

- Парсер витягує дані тільки з HTML
- При кожному оновленні старі дані очищуються
- Цени зберігаються як REAL числа
- Назви категорій та робіт повинні бути унікальними

## Допомога

Для додаткової інформації див. документацію у кожному файлу.
