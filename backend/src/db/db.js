import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: "localhost",
    dialect: "postgres",

    logging: (msg) => {
      // Catch more types of important messages
      if (
        msg.includes("ERROR") ||
        msg.includes("Failed") ||
        msg.includes("FATAL") ||
        msg.includes("Connection") ||
        msg.includes("timeout")
      ) {
        console.log(msg);
      }
    },
  }
);

export default sequelize;
