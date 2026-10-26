# Отчёт по практической работе № 9

**Тема:** Создание собственного HTTP API<br>
**Автор:** Осенний Илья<br>
**Группа:** ЭФБО-13-25<br>
**Вариант:** 5<br>
**Коммит сдаваемой версии кода:** `7d849e0`

## 1. Цель и результат

Цель: разобраться, как сервер принимает HTTP-запрос, выбирает обработчик, проверяет параметры, получает данные и формирует ответ.

Результат: Express-сервер возвращает состояние сервиса, категории, список задач и отдельную задачу. Список фильтруется по статусу, приоритету, категории и тексту; неизвестные, повторяющиеся и некорректные параметры отклоняются с `400 INVALID_QUERY`. Неверный id (`400 INVALID_ID`), отсутствующая задача (`404 TASK_NOT_FOUND`) и неизвестный маршрут (`404 ROUTE_NOT_FOUND`) различаются. На известных путях другие методы получают `405` и `Allow`. HEAD и OPTIONS работают, CORS-заголовки есть во всех ответах. Чтение не изменяет данные. Модульные проверки: 38 из 38, HTTP: 52 из 52.

## 2. Установка и запуск

**Версии:**

```text
node --version: v24.21.0
npm --version:  11.19.0
```

macOS 26.5.2. Рабочая папка: `practice-09` внутри личного репозитория.

```bash
cd practice-09
npm ci
npm start
```

API: `http://127.0.0.1:5505/api`, проверка: `/api/health`.

Во время ручных проверок порт 5505 был занят сервером ПР6, поэтому сервер запускался на другом порту:

```bash
npm start -- 5515
```

Режим разработки: `npm run dev`. С `.env`: `node --env-file=.env src/server.js`, обычный `npm start` файл не читает.

## 3. Реализация

| Модуль | Обязанность |
|---|---|
| `validation.js` | `parsePositiveId` и `parseFilters`: проверка и преобразование строк запроса. Не работает с `req` и `res`. |
| `task-service.js` | `selectTasks` (фильтры через И) и `findTask` (поиск по полю `id`). Не знает про HTTP. |
| `store.js` | Свои копии данных для каждого экземпляра приложения: `listTasks`, `getTask`, `listCategories`. |
| `routes.js` | Связь HTTP с логикой: разбор запроса, вызов `store`, формат ответа, ошибки 400/404/405. |
| `app.js` | Сборка: общие заголовки и OPTIONS → Router → 404 → обработчик ошибок. Порт не открывает. |
| `server.js` | Выбор порта и `listen`. |

**Значение `false`.** Статус принимается только как строки `'true'` и `'false'`, затем `filters.completed = completed === 'true'`. `Boolean('false')` дал бы `true`. В `selectTasks` отсутствие ограничения обозначено `null`, и проверка идёт через `filters.completed === null || task.completed === filters.completed`, поэтому `false` не пропускается, как было бы при `if (filters.completed)`.

**Дубликаты query.** `parseFilters` получает `URLSearchParams`, а не объект: сначала все имена из `searchParams.keys()` сверяются со списком разрешённых, затем для каждого имени `searchParams.getAll(name).length > 1` означает повтор. Повтор отклоняется даже при одинаковых значениях.

**Проверка id.** `parsePositiveId` требует, чтобы вся строка соответствовала `/^[1-9]\d*$/`, затем `Number.isSafeInteger`. Поэтому `0`, `01`, `-1`, `1.5`, `1e2`, `4abc`, пробелы и `9007199254740992` дают `null`. Тот же разбор используется для `categoryId`. Задача ищется по полю `id`, а не по индексу.

**Порядок middleware.** Общие заголовки и ранний ответ 204 на OPTIONS, затем Router: сначала GET-маршруты, после них `router.all` для четырёх известных путей с `Allow: GET, HEAD, OPTIONS` и ошибкой 405. Если бы `router.all` стоял раньше, он перехватил бы и GET. Затем обработчик неизвестного маршрута 404 и последним `errorHandler` с четырьмя параметрами. Обработчики бросают `ApiError`, Express передаёт исключение в `errorHandler`, тот формирует JSON.

## 4. Контракт

| Метод и путь | Статус | Тело |
|---|---:|---|
| `GET /api/health` | 200 | `{ data: { status: "ok" } }` |
| `GET /api/categories` | 200 | `{ data: category[], meta: { total } }` |
| `GET /api/tasks` | 200 | `{ data: task[], meta: { total, filters } }` |
| `GET /api/tasks/:id` | 200 | `{ data: task }` |
| `HEAD` тех же путей | как GET | без тела |
| `OPTIONS` любого пути | 204 | без тела, CORS |
| Другие методы на известных путях | 405 | `METHOD_NOT_ALLOWED`, `Allow: GET, HEAD, OPTIONS` |

Успешный ответ:

```text
GET /api/tasks/4
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"data":{"id":4,"title":"Подготовить модель задач","completed":false,"priority":"high","categoryId":2}}
```

Ошибки:

```text
GET /api/tasks/4abc → 400
{"error":{"code":"INVALID_ID","message":"Идентификатор задачи должен быть положительным целым числом."}}

GET /api/tasks/2 → 404
{"error":{"code":"TASK_NOT_FOUND","message":"Задача не найдена.","details":{"id":2}}}

POST /api/tasks → 405, Allow: GET, HEAD, OPTIONS
{"error":{"code":"METHOD_NOT_ALLOWED","message":"Метод POST не поддерживается для этого пути."}}
```

`meta.total` это размер полученной выборки после фильтров, а не всего хранилища: без фильтров 12, с `categoryId=1` 3. Пустая выборка это 200 и `data: []`.

Граница ПР9 и ПР10: сейчас только чтение. Создание, редактирование и удаление получают 405; их реализация и полная работа клиента ПР8 относятся к ПР10.

## 5. Индивидуальный вариант

Вариант 5: `?categoryId=1`, отрицательный сценарий `categoryId=01`.

| Запрос | Ожидаемые статус и данные | Фактический результат |
|---|---|---|
| `GET http://127.0.0.1:5515/api/tasks?categoryId=1` | 200, id 1, 7, 13, total 3 | 200, `data` с id 1, 7, 13; `meta: {"total":3,"filters":{"completed":null,"priority":null,"categoryId":1,"q":""}}` |
| `GET http://127.0.0.1:5515/api/tasks?categoryId=01` | 400 INVALID_QUERY | 400, `{"error":{"code":"INVALID_QUERY","message":"Параметр categoryId должен быть положительным целым числом."}}` |
| `GET http://127.0.0.1:5515/api/tasks/7` | 200, задача 7 | 200, `{"data":{"id":7,"title":"Проверить методы массивов","completed":false,"priority":"low","categoryId":1}}` |
| `GET http://127.0.0.1:5515/api/tasks/2` | 404 TASK_NOT_FOUND | 404, `{"error":{"code":"TASK_NOT_FOUND","message":"Задача не найдена.","details":{"id":2}}}` |

`01` отклоняется, потому что запись с ведущим нулём не соответствует `/^[1-9]\d*$/`. id 2 корректный, но такой задачи нет: идентификаторы разреженные (1, 4, 7, …).

## 6. Автоматические проверки

| Набор | Успешно | Неуспешно |
|---|---:|---:|
| Модульные (`npm run check:unit`) | 38 | 0 |
| HTTP (`npm run check:api`) | 52 | 0 |
| Всего (`npm test`) | 90 | 0 |

```text
✔ id принимает 1
✔ id принимает 4
✔ id принимает 9007199254740991
✔ id отклоняет ""
✔ id отклоняет "0"
✔ id отклоняет "-1"
✔ id отклоняет "01"
✔ id отклоняет "1.5"
✔ id отклоняет "1e2"
✔ id отклоняет "4abc"
✔ id отклоняет " 4 "
✔ id отклоняет "9007199254740992"
✔ Пустой запрос возвращает все значения по умолчанию
✔ Нормализация false, категории и пробелов поиска
✔ true преобразуется в boolean
✔ INVALID_QUERY: unknown=1
✔ INVALID_QUERY: q=a&q=b
✔ INVALID_QUERY: completed=false&completed=true
✔ INVALID_QUERY: priority=low&priority=high
✔ INVALID_QUERY: categoryId=1&categoryId=2
✔ INVALID_QUERY: completed=
✔ INVALID_QUERY: completed=0
✔ INVALID_QUERY: completed=False
✔ INVALID_QUERY: priority=
✔ INVALID_QUERY: priority=HIGH
✔ INVALID_QUERY: categoryId=0
✔ INVALID_QUERY: categoryId=01
✔ INVALID_QUERY: categoryId=2abc
✔ INVALID_QUERY: categoryId=9007199254740992
✔ INVALID_QUERY: q=яяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяяя
✔ Граница q: 100 после trim и пустая строка разрешены
✔ Неизвестная положительная категория допустима как фильтр
✔ Фильтры отсутствуют: все задачи без мутации исходных данных
✔ AND: false, high, категория 2
✔ Поиск без учёта регистра и без изменения порядка
✔ Пустая выборка — массив, не ошибка
✔ Поиск по id, отсутствующая задача и разреженные id
✔ Логика работает с другим массивом, без жёстко заданных id
ℹ tests 38
ℹ pass 38
ℹ fail 0
```

```text
✔ Health: 200 и согласованный JSON
✔ Категории: исходные данные и total
✔ Задачи: исходный массив, total и нормализованные filters
✔ Выборка completed=false
✔ Выборка completed=true
✔ Выборка priority=high
✔ Выборка priority=medium
✔ Выборка priority=low
✔ Выборка categoryId=1
✔ Выборка categoryId=2
✔ Выборка q=%20%20%D0%9F%D0%A0%D0%9E%D0%92%D0%95%D0%A0%20%20
✔ Выборка completed=false&priority=high&categoryId=2
✔ Выборка categoryId=999
✔ Выборка q=not-found-xyz
✔ Выборка q=
✔ GET одной задачи: id не равен индексу
✔ Некорректный id 0
✔ Некорректный id 01
✔ Некорректный id -1
✔ Некорректный id 4abc
✔ Некорректный id 1.5
✔ Некорректный id 1e2
✔ Некорректный id 9007199254740992
✔ Некорректный id %ZZ
✔ Отсутствующий id: 404 TASK_NOT_FOUND с details.id
✔ HTTP INVALID_QUERY completed=0
✔ HTTP INVALID_QUERY completed=
✔ HTTP INVALID_QUERY priority=HIGH
✔ HTTP INVALID_QUERY categoryId=01
✔ HTTP INVALID_QUERY categoryId=2abc
✔ HTTP INVALID_QUERY q=a&q=b
✔ HTTP INVALID_QUERY priority=low&priority=high
✔ HTTP INVALID_QUERY categoryId=1&categoryId=2
✔ HTTP INVALID_QUERY completed=false&completed=true
✔ HTTP INVALID_QUERY sort=id
✔ HTTP INVALID_QUERY q=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
✔ HEAD /api/health: статус и заголовки без тела
✔ HEAD /api/categories: статус и заголовки без тела
✔ HEAD /api/tasks: статус и заголовки без тела
✔ HEAD /api/tasks/4: статус и заголовки без тела
✔ HEAD отсутствующей задачи: 404 без тела
✔ OPTIONS: 204 без тела и CORS чтения
✔ POST /api/tasks: 405 и Allow
✔ PATCH /api/tasks/4: 405 и Allow
✔ DELETE /api/tasks/4: 405 и Allow
✔ PUT /api/categories: 405 и Allow
✔ POST /api/health: 405 и Allow
✔ Неизвестный путь /missing
✔ Неизвестный путь /api/missing
✔ Неизвестный путь /api/tasks/4/extra
✔ Фильтрация и запрещённое удаление не изменяют исходный набор
✔ Неожиданное исключение: 500 без утечки служебного текста
ℹ tests 52
ℹ pass 52
ℹ fail 0
```

## 7. Ручной протокол

Запросы выполнялись через `curl` к `http://127.0.0.1:5515/api`.

| № | Запрос | Ожидаемый результат | Фактический результат |
|---:|---|---|---|
| 1 | `GET /health` | 200, `ok` | 200, `{"data":{"status":"ok"}}` |
| 2 | `GET /categories` | 200, три категории | 200, Учёба, Проект, Организация, `total: 3` |
| 3 | `GET /tasks` | 200, 12 задач, фильтры по умолчанию | 200, 12 задач, `filters: {"completed":null,"priority":null,"categoryId":null,"q":""}` |
| 4 | `GET /tasks?categoryId=1` | id 1, 7, 13, total 3 | 200, id 1, 7, 13, `total: 3` |
| 5 | `GET /tasks?q=zzz` | 200, пустой массив, total 0 | 200, `{"data":[],"meta":{"total":0,...}}` |
| 6 | `GET /tasks/4` | задача с id 4 | 200, «Подготовить модель задач», id 4 |
| 7 | `GET /tasks/2`, `GET /tasks/4abc` | 404 и 400, разные коды | 404 `TASK_NOT_FOUND` с `details: {"id":2}`; 400 `INVALID_ID` |
| 8 | `GET /tasks?unknown=1`, `GET /tasks?q=a&q=b` | 400 INVALID_QUERY | 400 `INVALID_QUERY` «Неизвестный параметр: unknown.»; 400 `INVALID_QUERY` «Параметр q указан несколько раз.» |
| 9 | `POST /tasks` | 405, Allow, число задач не меняется | 405 `METHOD_NOT_ALLOWED`, `Allow: GET, HEAD, OPTIONS`; затем `GET /tasks` → `total: 12` |
| 10 | `GET /unknown` | 404 ROUTE_NOT_FOUND в JSON | 404, `{"error":{"code":"ROUTE_NOT_FOUND","message":"Маршрут не найден."}}` |
| 11 | `HEAD /tasks` (`curl -I`) | 200, JSON-заголовки, без тела | 200, `Content-Type: application/json; charset=utf-8`, `Content-Length: 1429`, тела нет |
| 12 | `OPTIONS /tasks` | 204, CORS, без тела | 204, `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`, тела нет |
| 13 | Остановить и запустить заново | Исходные данные доступны | После остановки запрос не проходит; после запуска `total: 12`, задача 4 на месте |

Пример `examples/books.js` (`npm run example`): `/books/3` → 200 `{"data":{"id":3,"title":"Алгоритмы"}}`, `/books/9` → 404.

Дополнительное чтение из браузерного клиента ПР8 не выполнялось.

## 8. Исправленный дефект

Все тесты прошли после реализации, поэтому типичный дефект из таблицы методички был воспроизведён намеренно, чтобы проверить, что тесты его ловят.

- **Симптом.** В `parseFilters` разбор статуса временно заменён на `filters.completed = Boolean(completed)`. `npm run check:unit`: 34 успешно, 4 неуспешно: «Нормализация false…», `completed=`, `completed=0`, `completed=False`.
- **Причина.** `Boolean` от любой непустой строки даёт `true`, поэтому `completed=false` превращался в `true`, а неверные значения (`0`, `False`) не отклонялись.
- **Исправление.** Возвращена явная проверка: допускаются только `'true'` и `'false'`, иначе `ApiError(400, 'INVALID_QUERY')`, затем `completed === 'true'`.
- **Повторная проверка.** `npm test`: 90 из 90.

## 9. Контрольные вопросы

1. **Node.js и браузер.** В Node.js нет DOM, `window` и `localStorage`, зато есть доступ к сети как серверу, файловой системе и процессу. Язык тот же.
2. **Выбор маршрута.** Путь и HTTP-метод. Query-строка не входит в путь: `/tasks?q=API` обрабатывается маршрутом `/tasks`.
3. **`req.params` и query.** `req.params` это части пути из шаблона маршрута (`:id`). Query это параметры после `?`, необязательные, их может быть несколько и они могут повторяться.
4. **Строка `'false'`.** Все параметры приходят строками, а `Boolean('false')` равно `true`. Нужно явно сравнить со строками `'true'` и `'false'`.
5. **Весь id и `isSafeInteger`.** `parseInt('4abc')` даёт 4 и принял бы мусор. Число больше `Number.MAX_SAFE_INTEGER` теряет точность и может совпасть с другим id.
6. **200 и 404.** Список существует всегда; пустая выборка это корректный результат запроса. Задача с конкретным id это ресурс, и его отсутствие означает 404.
7. **`TASK_NOT_FOUND` и `ROUTE_NOT_FOUND`.** Первое: маршрут есть, id корректный, но записи нет. Второе: такого пути в API нет вообще.
8. **405 и 404.** 405: путь существует, но метод для него не поддерживается. `Allow` сообщает клиенту, какие методы допустимы.
9. **`meta.total` при фильтрах.** Число задач в выборке после фильтров, а не во всём хранилище.
10. **Порядок middleware.** Express вызывает обработчики по порядку регистрации. Если 404 стоит перед Router, до маршрутов не дойдёт; если `router.all` перед GET, он перехватит чтение.
11. **Четыре параметра.** По сигнатуре `(error, req, res, next)` Express отличает обработчик ошибок от обычного middleware и передаёт ему исключения.
12. **Фабрика приложения.** `createApp()` не открывает порт, поэтому тесты создают отдельный экземпляр на свободном порту со своими данными и закрывают его после проверок.
13. **Данные при внутренней ошибке.** Только код `INTERNAL_ERROR` и общее сообщение. Стек, текст исключения и внутренние данные не отправляются.
14. **CORS и авторизация.** CORS только разрешает браузерному JavaScript с другого origin читать ответ. Он не проверяет, кто делает запрос, и не мешает `curl` или серверу обращаться к API.
15. **Изменения в ПР10.** Добавить `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id` и `POST /debug/reset`, разбор JSON-тела и его проверку, проверку существования категории, расширить `Allow` и CORS-методы, хранилище с изменением данных.

## 10. Вывод

Реализован Express-сервер для чтения задач и категорий с разделением на валидацию, логику выборки, хранилище, маршруты и сборку приложения. Параметры проверяются строго: id и `categoryId` целиком, `false` явно, повторы и неизвестные имена отклоняются. Ошибки возвращаются в едином JSON-формате с фиксированными кодами. Подтверждено 90 автоматическими проверками и 13 ручными запросами. Ограничения: данные в памяти, только чтение; запись относится к ПР10.
