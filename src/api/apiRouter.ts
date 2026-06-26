import { Router } from "express";

export const apiRouter = Router();

apiRouter.get("/test", (req, res) => {
  res.status(200).json({ message: "успешно" });
});
