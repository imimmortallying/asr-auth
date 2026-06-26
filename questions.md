- docker exec -it asr-postgres psql -U postgres -d asr. Окажешься внутри Postgres. Что значит окажешься внутри? Нет понимания, как докер связан с ОС с postgres. Где тут процессы, где контейнеры

- INSERT INTO "user" (login, "passwordHash") VALUES ('test', '$2b$10$e2kPUPnrSDZ.guE0Y8LxtOiGd0Fr/vGI/Zew3R09tHB9LI6Li1mGS'); внутри Postgres. Куда именно вводится эта команда? В процесс Postgres, а точнее?
почему "user", а не User, как в User.ts?

- как понять, какие заголовки обязательны при любом запросе? Или какие обязательны на сервере?

- посмотреть всех юзеров
docker exec -it asr-postgres psql -U postgres -d asr -c 'SELECT * FROM "user";'

- посмотреть все таблицы
docker exec -it asr-postgres psql -U postgres -d asr -c "\dt"

//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgxOTI5NDgwLCJleHAiOjE3ODQ1MjE0ODB9.lf-oWONwwCj-JQFyHfHYhL7WUx1Pj5cXyqScT41h-8Q