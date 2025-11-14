# 🚀 DEPLOYMENT GUIDE

Полное руководство по деплою проекта MafClubScore.

**Версия:** 1.0
**Обновлено:** 2025-11-14

---

## 📋 СОДЕРЖАНИЕ

1. [Требования](#требования)
2. [Первоначальная настройка](#первоначальная-настройка)
3. [Деплой на Vercel](#деплой-на-vercel)
4. [Настройка базы данных](#настройка-базы-данных)
5. [Environment Variables](#environment-variables)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Rollback Strategy](#rollback-strategy)
8. [Monitoring](#monitoring)

---

## ✅ ТРЕБОВАНИЯ

### Локальная разработка
- **Node.js:** >= 18.0.0
- **npm:** >= 9.0.0
- **Git:** >= 2.30.0

### Аккаунты
- ✅ GitHub аккаунт
- ✅ Vercel аккаунт (Hobby или Pro)
- ✅ Turso аккаунт (для БД)

### Инструменты
```bash
# Установить Vercel CLI
npm install -g vercel

# Проверить версию
vercel --version
```

---

## 🔧 ПЕРВОНАЧАЛЬНАЯ НАСТРОЙКА

### 1. Клонирование репозитория

```bash
git clone https://github.com/lifeexplorer230/mafclubscore.git
cd mafclubscore
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка окружения

Создать файл `.env.local`:
```bash
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...

# App Version
APP_VERSION=v1.13.0
```

### 4. Локальный запуск

```bash
# Development сервер
npm run dev

# Откроется на http://localhost:3000
```

---

## ☁️ ДЕПЛОЙ НА VERCEL

### Способ 1: Через Vercel Dashboard (рекомендуется для первого раза)

1. **Авторизоваться на vercel.com**
2. **Создать новый проект:**
   - Import Git Repository
   - Выбрать `lifeexplorer230/mafclubscore`
3. **Настроить Environment Variables** (см. раздел ниже)
4. **Deploy!**

---

### Способ 2: Через Vercel CLI

#### Первый деплой

```bash
# 1. Авторизоваться
vercel login

# 2. Link проект
vercel link

# 3. Настроить environment variables
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
vercel env add APP_VERSION production

# 4. Деплой на production
vercel --prod
```

#### Последующие деплои

```bash
# Production deploy
vercel --prod

# Preview deploy (автоматически для каждого push)
vercel
```

---

### Способ 3: Автоматический деплой через GitHub

**Настроено по умолчанию!**

```bash
# Push в main → автоматический деплой на production
git push origin main

# Push в другие ветки → preview деплой
git push origin feature/my-feature
```

---

## 💾 НАСТРОЙКА БАЗЫ ДАННЫХ

### Turso Database Setup

#### 1. Создать аккаунт на turso.tech

```bash
# Установить Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Авторизоваться
turso auth login
```

#### 2. Создать базу данных

```bash
# Создать новую БД
turso db create mafclub-prod

# Получить URL
turso db show mafclub-prod

# Создать токен
turso db tokens create mafclub-prod
```

#### 3. Импортировать схему

```bash
# Из файла schema.sql
turso db shell mafclub-prod < schema.sql
```

#### 4. Проверка подключения

```bash
# Проверить таблицы
turso db shell mafclub-prod "SELECT name FROM sqlite_master WHERE type='table';"
```

---

## 🔐 ENVIRONMENT VARIABLES

### Production Variables

В Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `TURSO_DATABASE_URL` | `libsql://xxx.turso.io` | Production |
| `TURSO_AUTH_TOKEN` | `eyJhbGc...` | Production |
| `APP_VERSION` | `v1.13.0` | Production |

### Добавление через CLI

```bash
# Production
printf "libsql://..." | vercel env add TURSO_DATABASE_URL production
printf "eyJ..." | vercel env add TURSO_AUTH_TOKEN production
printf "v1.13.0" | vercel env add APP_VERSION production

# Preview (optional)
printf "libsql://..." | vercel env add TURSO_DATABASE_URL preview

# Development (optional)
printf "libsql://..." | vercel env add TURSO_DATABASE_URL development
```

### Обновление переменных

```bash
# 1. Удалить старую
vercel env rm APP_VERSION production --yes

# 2. Добавить новую
printf "v1.14.0" | vercel env add APP_VERSION production

# 3. Редеплой для применения
vercel --prod
```

---

## 🔄 CI/CD PIPELINE

### GitHub Actions Workflows

**Автоматически запускаются при:**

1. **Push в main/develop** → `e2e-tests.yml`
   - Запуск E2E тестов
   - Upload артефактов при ошибках

2. **Pull Request в main** → `pr-checks.yml`
   - Проверка версий
   - Запуск тестов
   - Комментарий с результатами

3. **Push в любую ветку** → `test.yml`
   - Unit тесты
   - Lint проверка
   - Security audit

### Локальная проверка перед push

```bash
# Pre-commit hook автоматически проверяет:
# 1. Синхронизацию версий (package.json ↔ api/version.js)
# 2. Синтаксис JavaScript
# 3. Lint-staged

# Запуск вручную:
npm test                    # Unit тесты
npm run test:e2e:critical  # E2E тесты
```

---

## ⏮️ ROLLBACK STRATEGY

### Откат на предыдущую версию

#### Способ 1: Через Vercel Dashboard

1. Перейти в Deployments
2. Найти предыдущий успешный деплой
3. Нажать "Promote to Production"

#### Способ 2: Через CLI

```bash
# 1. Найти предыдущий deployment
vercel ls

# 2. Промотировать конкретный деплой
vercel promote <deployment-url>
```

#### Способ 3: Git Revert

```bash
# 1. Откатить коммит
git revert HEAD

# 2. Push (автоматический деплой)
git push origin main
```

---

### Откат базы данных

**⚠️ ВАЖНО:** Turso не поддерживает автоматические бэкапы на бесплатном плане!

**Рекомендации:**
1. Регулярно делать экспорт БД
2. Хранить дампы в приватном репозитории
3. Перед критическими изменениями — снапшот

```bash
# Экспорт БД
turso db shell mafclub-prod ".dump" > backup-$(date +%Y%m%d).sql

# Восстановление
turso db shell mafclub-prod < backup-20250114.sql
```

---

## 📊 MONITORING

### Health Check Endpoints

```bash
# Проверка версии
curl https://mafclubscore.vercel.app/api/version

# Проверка БД
curl https://mafclubscore.vercel.app/api/rating

# Проверка авторизации
curl -X POST https://mafclubscore.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### Vercel Logs

```bash
# Последние логи
vercel logs

# Логи за час
vercel logs --since 1h

# Логи конкретного деплоя
vercel logs <deployment-url>
```

### GitHub Actions Status

Проверить статус тестов:
- https://github.com/lifeexplorer230/mafclubscore/actions

---

## 🔥 PRODUCTION DEPLOYMENT CHECKLIST

Перед каждым деплоем на production:

- [ ] ✅ Все тесты проходят локально
  ```bash
  npm test
  npm run test:e2e:critical
  ```

- [ ] ✅ Версия обновлена
  ```bash
  node scripts/bump-version.js
  git add -A
  git commit --amend --no-edit
  ```

- [ ] ✅ Pre-commit hooks прошли успешно

- [ ] ✅ ROADMAP.md обновлён с changelog

- [ ] ✅ Environment variables актуальные

- [ ] ✅ БД миграции применены (если есть)

- [ ] ✅ Есть план отката (известен последний стабильный деплой)

---

## 🚨 TROUBLESHOOTING

### "Resource is limited - try again in X minutes"

**Проблема:** Превышен лимит деплоев (100/день)

**Решение:**
- Подождать указанное время
- Батчить изменения перед деплоем
- Рассмотреть Vercel Pro план

---

### "Deployment failed"

**Проверить:**
1. Логи в Vercel Dashboard
2. Environment variables установлены
3. package.json корректен
4. Нет синтаксических ошибок

```bash
# Проверка синтаксиса
find . -name "*.js" -not -path "./node_modules/*" | xargs node --check
```

---

### "Database connection failed"

**Проверить:**
1. TURSO_DATABASE_URL корректен
2. TURSO_AUTH_TOKEN актуален
3. БД существует и доступна

```bash
# Тест подключения
turso db shell mafclub-prod "SELECT 1;"
```

---

## 📞 SUPPORT

- **GitHub Issues:** https://github.com/lifeexplorer230/mafclubscore/issues
- **Vercel Support:** https://vercel.com/support
- **Turso Docs:** https://docs.turso.tech

---

**Версия документа:** 1.0
**Проект:** MafClubScore v1.13.0
**Автор:** МАФ-Клуб SHOWTIME
