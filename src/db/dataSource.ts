import { DataSource } from "typeorm";
import { RefreshToken } from "../auth/RefreshToken";
import { User } from "../user/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "asr_auth",
  entities: [RefreshToken, User],
  synchronize: true,
});
