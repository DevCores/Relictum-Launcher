# Серверная конфигурация для Relictum Launcher

## Обзор

Этот каталог содержит конфигурационные файлы для сервера обновлений лаунчера. Лаунчер проверяет целостность файлов клиента и автоматически скачивает обновления.

## Структура файлов

```
server-config/
├── README.md                           # Этот файл
├── classic-manifest.json              # Манифест для Classic (1.12.1)
├── tbc-manifest.json                  # Манифест для TBC (2.4.3)
└── wotlk-manifest.json                # Манифест для WotLK (3.3.5a)
```

## Настройка сервера

### 1. Структура URL

Ваш сервер должен предоставлять следующие эндпоинты:

```
/api/manifests/classic.json     # Манифест Classic
/api/manifests/tbc.json         # Манифест TBC
/api/manifests/wotlk.json       # Манифест WotLK

/files/full/classic.zip          # Полный клиент Classic
/files/full/tbc.zip              # Полный клиент TBC
/files/full/wotlk.zip            # Полный клиент WotLK

/files/patches/classic/          # Патчи для Classic
/files/patches/tbc/              # Патчи для TBC
/files/patches/wotlk/            # Патчи для WotLK
```

### 2. Формат манифеста

```json
{
  "version": "1.12.1",
  "lastUpdated": "2025-01-07",
  "files": {
    "WoW.exe": "sha256-hash-here",
    "Data/file.mpq": "sha256-hash-here"
  },
  "patches": [
    {
      "version": "1.12.1",
      "url": "https://your-server.com/patches/patch-file.patch",
      "size": 52428800,
      "checksum": "sha256-hash-of-patch"
    }
  ]
}
```

### 3. Генерация хэшей

Используйте скрипт для генерации SHA256 хэшей:

```bash
# Для файла
sha256sum WoW.exe

# Для всех файлов в директории
find . -type f -exec sha256sum {} \; > hashes.txt
```

## Настройка лаунчера

### 1. Измените URL сервера

В файле `electron/main.js` измените константы:

```javascript
const UPDATE_SERVER_URL = 'https://your-server.com/api';
const UPDATE_FILES_URL = 'https://your-server.com/files';
```

### 2. Создайте реальные файлы клиентов

- Скачайте оригинальные клиенты WoW нужных версий
- Создайте ZIP архивы
- Загрузите их на сервер
- Обновите URL в конфигурации клиентов

### 3. Генерация манифестов

Запустите скрипт генерации манифестов:

```bash
node generate-manifests.js
```

## Безопасность

### 1. HTTPS Only

Все запросы должны идти через HTTPS для защиты от MITM атак.

### 2. Валидация хэшей

Лаунчер проверяет SHA256 хэши всех файлов перед установкой.

### 3. Сертификаты

Используйте валидные SSL сертификаты.

## Мониторинг

### 1. Логи сервера

Мониторьте запросы к:
- `/api/manifests/*.json` - проверки обновлений
- `/files/full/*.zip` - скачивания клиентов
- `/files/patches/*` - скачивания патчей

### 2. Ошибки

Обрабатывайте ошибки:
- 404 - файл не найден
- 500 - ошибка сервера
- Таймауты при больших загрузках

## Развертывание

### Рекомендуемая инфраструктура:

1. **Web сервер** (Nginx/Apache) для статических файлов
2. **CDN** (Cloudflare, AWS CloudFront) для распределения нагрузки
3. **Мониторинг** (упавший сервер, высокая нагрузка)
4. **Бэкапы** всех файлов и манифестов

### Пример nginx конфигурации:

```nginx
server {
    listen 443 ssl;
    server_name your-server.com;

    # SSL конфигурация
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # API эндпоинты
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }

    # Статические файлы
    location /files/ {
        root /var/www/downloads;
        autoindex off;

        # Ограничение скорости для больших файлов
        limit_rate 1m;

        # CORS для лаунчера
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, HEAD';
    }
}
```

## Обновление клиентов

### Процесс обновления:

1. Лаунчер скачивает манифест
2. Сравнивает локальные хэши с серверными
3. Скачивает только измененные файлы (патчи)
4. Или полную версию при серьезных изменениях

### Создание патчей:

```bash
# Создание бинарного патча
bsdiff old_file new_file patch.patch

# Применение патча
bspatch old_file new_file patch.patch
```

## Troubleshooting

### Распространенные проблемы:

1. **Манифест не загружается** - проверьте CORS и HTTPS
2. **Хэши не совпадают** - файл поврежден при загрузке
3. **Большой трафик** - настройте CDN или rate limiting
4. **Дисковое пространство** - мониторьте использование диска

### Логи лаунчера:

Лаунчер логирует все операции в консоль разработчика (F12).

