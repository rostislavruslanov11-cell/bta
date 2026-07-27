# Настройка сайта записи (Pure Beauty)

Архитектура: **GitHub Pages** (статичен сайт, деплой автоматично при всеки push) + **Google Apps Script** (бекенд, който пише директно в твоя Google Calendar).

Няма Vercel, няма отделен акаунт за хостинг, няма service account/private key — всичко върви през GitHub, освен самия Apps Script (той е Google, неизбежно, защото пише в Google Calendar).

Еднократна настройка отнема ~10 минути.

## Част 1 — Google Apps Script (бекенд)

1. Отвори https://script.google.com (със същия Google акаунт, в който е твоят календар) → **New project**.
2. Изтрий съдържимото на `Code.gs` по подразбиране и постави съдържимото от [`apps-script/Code.gs`](apps-script/Code.gs) от този репозиторий.
3. В менюто вляво (иконка зъбно колело "Project Settings") → покажи `appsscript.json` в редактора (Show "appsscript.json" manifest file in editor checkbox) → отвори го и постави съдържимото на [`apps-script/appsscript.json`](apps-script/appsscript.json).
4. Ако използваш календар, различен от основния — смени `CALENDAR_ID` в горната част на `Code.gs` (иначе остави `'primary'`).
5. Горе вдясно → **Deploy → New deployment**:
   - Тип: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy**
6. Ще получиш URL от вида `https://script.google.com/macros/s/XXXXX/exec` — това е адресът на бекенда. Копирай го.
7. При първо стартиране Google ще поиска разрешение (авторизация на скрипта до твоя календар) — потвърди с твоя акаунт.

## Част 2 — GitHub Pages (сайт)

1. В репозитория [bta](https://github.com/rostislavruslanov11-cell/bta) → **Settings → Pages** → под "Build and deployment" → Source: **GitHub Actions** (само този чекбокс, еднократно).
2. Пак в Settings → **Secrets and variables → Actions → Variables** таб → **New repository variable**:
   - Name: `APPS_SCRIPT_URL`
   - Value: URL-ът от Част 1, стъпка 6
3. Всеки push в `main` (папка `public/`) автоматично пуска workflow-а `.github/workflows/deploy.yml`, който качва сайта на GitHub Pages и слага правилния URL в `config.js`.
4. Адресът на сайта ще е нещо от рода `https://rostislavruslanov11-cell.github.io/bta/` — виждаш го в Settings → Pages, след първия успешен деплой.

## Проверка

1. Отвори сайта, направи тестова резервация за утре.
2. Провери Google Calendar — трябва да се появи събитие с името на клиента и услугата.
3. Опитай да резервираш пак същия час — сайтът трябва да покаже "този час вече е зает".

## Ако нещо в Code.gs се промени по-късно

Промените в `apps-script/Code.gs` в GitHub НЕ се качват автоматично в script.google.com (това е ръчна стъпка, различна система от GitHub Pages). При промяна: копирай новото съдържимо в script.google.com редактора → **Deploy → Manage deployments** → редактирай активния деплой → **Deploy** (така URL адресът остава същият).

## Какво може да се коригира

- Работно време (сега 09:00–19:00) и продължителност на услугите — в началото на `apps-script/Code.gs`.
- Списък услуги и цени — в `public/booking.html` (`<select>`) и `apps-script/Code.gs` (`SERVICES`).
- Собствен домейн вместо `github.io` — Settings → Pages → Custom domain (домейнът сам по себе си може да струва пари при регистратор, ако не искаш безплатния поддомейн).

## Следваща стъпка — Google Search Console (за да те намират в Google)

Мета описанията вече са сложени на всяка страница (безплатно, готово). За да се появи сайтът в Google търсенето обаче трябва собственикът (ти) да потвърди собствеността — това е стъпка, която аз не мога да направя вместо теб.

1. Отвори https://search.google.com/search-console
2. Избери **URL prefix** → въведи `https://rostislavruslanov11-cell.github.io/bta/`
3. Google ще предложи метод за потвърждение — най-лесният за GitHub Pages е **HTML файл**: изтегляш файл (нещо като `google1234567890abcdef.html`), казваш ми името му, и аз го качвам в `public/` и пускам deploy. После в Search Console натискаш "Verify".
4. След потвърждаване → **Sitemaps** → добави `sitemap.xml` (ще го генерирам, когато стигнем дотук — за момента сайтът е малък, 10 страници, може и без sitemap, само ръчно добавяне на всеки URL).
5. Резултати (сайтът да започне да излиза в търсенето) отнема от няколко дни до няколко седмици — не е мигновено дори след потвърждение.
