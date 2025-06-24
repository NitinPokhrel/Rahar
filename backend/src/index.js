import { app } from "./app.js";
import dotenv from "dotenv";
import sequelize from "./db/db.js";




dotenv.config()


sequelize.sync({ force: false }) 
  .then(() => {
    console.log("Users table synced successfully.");
  })
  .catch((err) => {
    console.error("Failed to sync users table:", err);
  });


sequelize.authenticate().then( ()=>{
    app.listen(8000 || process.env.PORT, () => {
        console.log("server is running on port " + process.env.PORT);
      });
})
  .catch ((error)=>{
    console.log("failed to connect database", error);
  }) 

  
    