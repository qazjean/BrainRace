# BrainRace Frontend — Руководство по запуску

Это детальное руководство поможет запустить актуальную версию BrainRace только по исходникам, без предварительно установленных зависимостей. Внизу описаны все шаги для macOS, Windows и Linux.

---
## 1. Предварительные требования

1. **Node.js** (поддерживается LTS 18.x или 20.x)
   ```bash
   # macOS (через Homebrew)
   brew install node

   # Ubuntu / Debian
   sudo apt update && sudo apt install -y nodejs npm

   # Windows (через winget)
   winget install OpenJS.NodeJS.LTS
   ```

2. **Git** (для загрузки проекта из репозитория)
   ```bash
   # macOS
   brew install git

   # Ubuntu / Debian
   sudo apt install -y git

   # Windows
   winget install Git.Git
   ```

3. **LangChain CLI** — требуется для работы GigaChat-интеграции. Ставим глобально:
   ```bash
   npm install -g langchain
   ```

4. **GigaChat / Sber API токен** — сохраните в переменной окружения или .env файле как GIGACHAT_TOKEN.

---
## 2. Клонирование проекта

```bash
git clone https://github.com/qazjean/BrainRace
cd <путь_к_проекту>/frontend
```

---
## 3. Установка зависимостей

```bash
npm install
```

*Если используете Node 18+, npm уже в комплекте. Для yarn/pnpm просто замените команду.*

---
## 4. Запуск backend-сервера (Express)

1. Перейдите в папку `frontend/server`.
2. Установите зависимости сервера:
   ```bash
   cd frontend/server
   npm install
   ```
3. Задайте переменные окружения (пример через `.env`):
   ```bash
   PORT=4000
   GIGACHAT_TOKEN=<ВАШ_GIGACHAT_API_TOKEN>

   ```
4. Запустите сервер:
   ```bash
   npm run start
   # или, если есть скрипт dev/server
   npm run dev
   ```

Сервер поднимет API на `http://localhost:4000`. Внутри прописаны маршруты:
- `/api/profile` — профиль и статистика
- `/api/analyze` — анализ результатов
- `/api/giga/advice` — советы от GigaChat
- `/api/generate` — генератор игр

**Важно:** серверу нужен доступ к GigaChat. Проверьте токен и активируйте LangChain, если планируется трейсинг/кэширование.

---
## 5. Запуск фронтенда (Vite + React)

1. Перейдите в `frontend` (если ещё не там).
2. Запустите Vite dev server:
   ```bash
   npm run dev
   ```
3. Откройте в браузере `http://localhost:3000`. Vite автоматически проксирует `/api` на `http://localhost:4000` (см. `vite.config.js`).

---
## 6. Полный пакет команд

```bash
# 0. Клонирование
git clone <URL> && cd frontend

# 1. Установка зависимостей
npm install

# 2. LangChain CLI (глобально)
npm install -g langchain

# 3. Переменные окружения

# 4. Backend
cd server
npm install
npm run start  # поднимает порт 4000

# 5. Frontend
cd ..
npm run dev  # порт 3000
```

## 7. Траблшутинг
- **Проблемы с GigaChat:** проверьте токен и привязку LangChain (иногда нужен VPN или whitelisting).
- **npm ERR!** — удалите `node_modules`, `package-lock.json` и переустановите (`npm install`).
- **Прокси не работает:** проверьте, что backend действительно стартует на `4000`. Можно временно задать другой порт в `vite.config.js`.


