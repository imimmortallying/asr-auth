if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET не задан в .env");
}

export const config = {
  jwtSecret: process.env.JWT_SECRET,
};
