# Relictum Launcher Backend

Backend API для лаунчера World of Warcraft клиентов.

## Установка

```bash
cd server
npm install
```

## Предварительные требования

### MySQL Database
Убедитесь, что у вас установлен MySQL сервер. Создайте базу данных:

```sql
CREATE DATABASE relictum_launcher;
```

## Конфигурация

Создайте файл `.env` в папке `server/` со следующим содержимым:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=relictum_launcher
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRE=7d

# CORS
CLIENT_URL=http://localhost:5174

# File Upload
MAX_FILE_SIZE=100000000  # 100MB in bytes

# Security
BCRYPT_ROUNDS=12
```

## Запуск

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Заполнение базы данных тестовыми данными
```bash
npm run db:seed
```

## Структура базы данных

### Таблицы
- **users** - пользователи и их профили
- **clients** - версии клиентов WoW
- **downloads** - история загрузок

### Отношения
- Download принадлежит User (userId)
- Client содержит статистику загрузок

## API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `GET /api/auth/profile` - Получить профиль пользователя
- `PUT /api/auth/profile` - Обновить профиль
- `PUT /api/auth/change-password` - Сменить пароль

### Clients
- `GET /api/clients` - Получить список активных клиентов
- `GET /api/clients/:id` - Получить информацию о клиенте
- `GET /api/clients/:id/manifest` - Получить манифест файлов клиента
- `POST /api/clients/:id/download` - Начать загрузку клиента
- `PUT /api/clients/download/:downloadId/progress` - Обновить прогресс загрузки
- `PUT /api/clients/download/:downloadId/complete` - Завершить загрузку
- `POST /api/clients/:id/verify` - Проверить целостность файла

### Users
- `GET /api/users/downloads` - История загрузок пользователя
- `GET /api/users/stats` - Статистика пользователя

### Stats
- `GET /api/stats/general` - Общая статистика
- `GET /api/stats/clients/:clientId` - Статистика по клиенту
- `GET /api/stats/analytics` - Аналитика (только админ)

## Модели данных

### User
- Аутентификация и профиль пользователя
- История загрузок
- Любимые клиенты

### Client
- Информация о версиях WoW клиентов
- Манифесты файлов с хэшами
- Статистика загрузок

### Download
- Отслеживание загрузок
- Прогресс и статус
- Аналитика

## Безопасность

- JWT аутентификация
- Bcrypt хэширование паролей
- Rate limiting
- CORS защита
- Helmet для HTTP заголовков
- Валидация входных данных

## Разработка

### Добавление нового клиента

1. Создать запись в базе данных через MongoDB или API
2. Сгенерировать манифест файлов с помощью утилит
3. Загрузить файлы клиента на сервер
4. Обновить downloadUrl в записи клиента

### Структура проекта

```
server/
├── config/          # Конфигурация базы данных MySQL
├── controllers/     # Логика обработки запросов
├── middleware/      # Промежуточное ПО
├── models/          # Sequelize модели данных
├── routes/          # Маршруты API
├── scripts/         # Скрипты (seed, migrations)
├── utils/           # Утилиты для работы с файлами
├── server.js        # Главный файл сервера
├── package.json     # Зависимости
├── README.md        # Документация
└── env.example      # Пример конфигурации
```

## Архитектура

- **ORM**: Sequelize для работы с MySQL
- **Аутентификация**: JWT токены
- **Безопасность**: bcrypt хэширование, rate limiting, CORS
- **Real-time**: Socket.io для обновлений прогресса
- **Валидация**: Sequelize validators + custom middleware
