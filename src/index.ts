import "dotenv/config";
import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./db/dataSource";
import { authRouter } from "./auth/authRouter";
import { authMiddleware } from "./auth/authMiddleware";
import { apiRouter } from "./api/apiRouter";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET не задан в .env");
}

const app = express();
app.use(express.json());

AppDataSource.initialize()
  .then(() => {
    console.log("БД подключена");
    app.listen(3000, () => {
      console.log("Сервер запущен на порту 3000");
    });
  })
  .catch((error) => {
    console.error("Ошибка подключения к БД:", error);
  });

app.use("/auth", authRouter);

app.use("/api", authMiddleware, apiRouter);
