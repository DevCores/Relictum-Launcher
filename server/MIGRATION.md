# Миграция с MongoDB на MySQL

## Обзор изменений

Проект был успешно перенесен с MongoDB на MySQL для лучшей производительности и надежности.

## Основные изменения

### 1. Зависимости
**Удалено:**
- `mongoose`

**Добавлено:**
- `sequelize`
- `mysql2`

### 2. Модели данных
**MongoDB (Mongoose):**
```javascript
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});
```

**MySQL (Sequelize):**
```javascript
const User = sequelize.define('User', {
  username: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING
});
```

### 3. Конфигурация базы данных
**MongoDB:**
```javascript
mongoose.connect('mongodb://localhost/db');
```

**MySQL:**
```javascript
const sequelize = new Sequelize('db', 'user', 'pass', {
  host: 'localhost',
  dialect: 'mysql'
});
```

### 4. Запросы к данным
**MongoDB:**
```javascript
const users = await User.find({ role: 'admin' });
```

**MySQL:**
```javascript
const users = await User.findAll({
  where: { role: 'admin' }
});
```

## Преимущества MySQL

### Производительность
- Лучше оптимизированные запросы для сложных JOIN
- ACID транзакции
- Индексы для быстрого поиска

### Надежность
- Строгая типизация данных
- Foreign key constraints
- Data integrity

### Масштабируемость
- Horizontal partitioning
- Read replicas
- Connection pooling

## Совместимость данных

### Поля с изменениями типов
| Поле | MongoDB | MySQL |
|------|---------|-------|
| `size` | Number | BIGINT |
| `files` | Object | JSON |
| `systemRequirements` | Object | JSON |
| `changelog` | Array | JSON |

### Новые поля
- `id` (INTEGER AUTO_INCREMENT) - первичный ключ
- `clientId` (ENUM) - для внешних ссылок
- `userId` (INTEGER) - внешний ключ на users

## Миграция существующих данных

Если у вас есть существующие данные в MongoDB, используйте скрипт миграции:

```bash
# Экспорт из MongoDB
mongoexport --db=relictum --collection=users --out=users.json
mongoexport --db=relictum --collection=clients --out=clients.json
mongoexport --db=relictum --collection=downloads --out=downloads.json

# Импорт в MySQL (требуется кастомный скрипт)
node scripts/migrate-from-mongo.js
```

## Запуск после миграции

1. **Установите MySQL сервер**
2. **Создайте базу данных:**
   ```sql
   CREATE DATABASE relictum_launcher;
   ```
3. **Настройте .env файл**
4. **Запустите seeding:**
   ```bash
   npm run db:seed
   ```
5. **Тестируйте подключение:**
   ```bash
   npm run db:test
   ```

## Troubleshooting

### Ошибка подключения
```
Error: ER_ACCESS_DENIED_ERROR
```
**Решение:** Проверьте учетные данные в `.env`

### Ошибка создания таблиц
```
Error: Table 'users' already exists
```
**Решение:** Удалите таблицы или используйте `force: true` в sync

### Проблемы с типами данных
```
Error: Data too long for column
```
**Решение:** Проверьте лимиты VARCHAR/TEXT полей в моделях

## Rollback

Если нужно откатиться на MongoDB:

1. **Восстановите package.json:**
   ```json
   "mongoose": "^8.0.0"
   ```

2. **Восстановите старые модели** из git history

3. **Обновите конфигурацию** database.js

4. **Переустановите зависимости:**
   ```bash
   npm install
   ```

## Производительность

### MySQL оптимизации
- Используйте EXPLAIN для анализа запросов
- Добавляйте индексы на часто используемые поля
- Используйте connection pooling
- Настройте innodb_buffer_pool_size

### Рекомендуемые индексы
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_clients_client_id ON clients(client_id);
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_created_at ON downloads(created_at);
```

## Мониторинг

### Метрики для отслеживания
- Query execution time
- Connection pool usage
- Table sizes
- Index usage statistics

### Инструменты
- **phpMyAdmin** - веб-интерфейс
- **MySQL Workbench** - GUI клиент
- **Sequelize CLI** - управление миграциями
