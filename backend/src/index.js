import dotenv from "dotenv";
dotenv.config();
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;


app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});



// import sequelize from "./db/db.js";