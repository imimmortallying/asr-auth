import { Router } from "express";
import { AppDataSource } from "../db/dataSource";
import { User } from "../user/User";
import { compare } from "bcrypt";
import * as jwt from "jsonwebtoken";
import { RefreshToken } from "./RefreshToken";
import { config } from "../config";

// нужно понять, что за роут. Почему вообще в бэкенд приложении должен быть роут
// какие еще есть части.
export const authRouter = Router();

// (parameter) res: Response<any, Record<string, any>, number> - что я должен понять из этого?
// как без документации вообще что-то типизировать?

authRouter.post("/login", async (req, res) => {
  if (!req.body.login || !req.body.password) {
    // почему именно json? что еще можно?
    return res.status(400).json({ message: "Необходимы логин и пароль" });
  }

  const userRepository = AppDataSource.getRepository(User);

  // а что если не написать await?
  const user = await userRepository.findOne({
    where: { login: req.body.login },
  });

  if (!user) {
    return res.status(400).json({ message: "такой пользователь не найден" });
  }

  const isPasswordValid = await compare(req.body.password, user.passwordHash);

  if (!isPasswordValid) {
    return res.status(400).json({ message: "Неверный логин или пароль" });
  }

  const accessToken = jwt.sign(
    { id: user.id, login: user.login },
    config.jwtSecret,
    {
      expiresIn: "30m",
    },
  );
  // config.jwtSecret ключ д.б. длинной случайной строкой из переменной окружения. Почему переменные окружение считаются безопасными?
  // как вообще проверить, что он не был подделан? Как работает механизм?

  const refreshToken = jwt.sign({ id: user.id }, config.jwtSecret, {
    expiresIn: "30d",
  });

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

  try {
    await refreshTokenRepository.save({
      token: refreshToken,
      expiresAt: expiresAt,
      userId: user.id,
    });
  } catch {
    return res
      .status(500)
      .json({ message: "Не удалось создать сессию, повторите позднее" });
  }

  return res.status(200).json({ refreshToken, accessToken });
});

// refresh
// принимаем refresh токен, если все ок, то возвращаем новый access токен

authRouter.post("/refresh", async (req, res) => {
  // предположу, что из электрон приложения токены будут приходить в теле
  const userRefreshToken = req.body.refreshToken;
  if (!userRefreshToken) {
    return res.status(400).json({ message: "нет refresh токена" });
  }

  // config.jwtSecret у access и refresh могут быть одинаковыми? Или лучше нет? Видимо, нет
  let oldAccessToken;
  try {
    oldAccessToken = jwt.verify(
      userRefreshToken,
      // config.jwtSecret as string,
      config.jwtSecret,
      { complete: true },
    );
  } catch {
    return res
      .status(400)
      .json({ message: "refresh token сломан, нужна повторная авторизация" });
  }

  const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

  const isSessionValid = await refreshTokenRepository.findOne({
    where: { token: userRefreshToken },
  });

  if (!isSessionValid) {
    return res.status(401).json({ message: "сессия не найдена" });
  }

  if (isSessionValid.expiresAt < new Date()) {
    return res.status(401).json({ message: "refresh токен истёк" });
  }

  const userRepository = AppDataSource.getRepository(User);
  const payload = oldAccessToken.payload as jwt.JwtPayload;
  const user = await userRepository.findOne({
    where: { id: payload.id },
  });

  if (!user) {
    return res.status(400).json({ message: "такой пользователь не найден" });
  }

  // это повторяется, можно было бы вынести во что-то типа "generateAccessToken"
  const newAccessToken = jwt.sign(
    { id: user.id, login: user.login },
    config.jwtSecret,
    {
      expiresIn: "30m",
    },
  );

  return res.status(200).json({ accessToken: newAccessToken });
});

authRouter.post("/logout", async (req, res) => {
  const userAccessToken = req.body.accessToken;
  const userRefreshToken = req.body.refreshToken;

  if (!userAccessToken || !userRefreshToken) {
    return res.status(400).json({ message: "не удалось завершить сессию" });
  }

  const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
  const userRepository = AppDataSource.getRepository(User);

  // проверка текущей сессии
  try {
    jwt.verify(userAccessToken, config.jwtSecret);
  } catch {
    return res.status(401).json({ message: "невалидный access токен" });
  }

  // проверку refresh токена на валидность (jwt.verify) не провожу
  // если он сломан, то я его просто в бд не смогу найти

  // переиспользую код из '/refresh'
  const isSessionValid = await refreshTokenRepository.findOne({
    where: { token: userRefreshToken },
  });

  if (!isSessionValid) {
    return res.status(401).json({ message: "сессия не найдена" });
  }

  if (isSessionValid.expiresAt < new Date()) {
    return res.status(401).json({ message: "refresh токен истёк" });
  }

  // нужен ли try/catch. Видимо, нет?
  // Смотрю тип Promise<DeleteResult> и не понимаю что он вернет если удаление сработало или если не сработало

  try {
    await refreshTokenRepository.delete({ token: userRefreshToken });
  } catch {
    return res.status(500).json({ message: "не удалось завершить сессию" });
  }
  return res.status(200).json({ message: "logout выполнен" });
});
