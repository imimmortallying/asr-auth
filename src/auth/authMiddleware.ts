import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { config } from "../config";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: "нет доступа" });
    return;
  }

  try {
    const accessToken = authHeader.split(" ")[1];
    jwt.verify(accessToken, config.jwtSecret, { complete: true });
  } catch {
    return res.status(401).json({ message: "нет доступа" });
  }

  next();
};
