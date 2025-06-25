import sequelize from "./db/db.js";
import dotenv from "dotenv";
dotenv.config();
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;


app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});



// import sequelize from "./db/db.js";




sequelize.sync({ force: false }) 
  .then(() => {
    console.log("table synced successfully.");
  })
  .catch((err) => {
    console.error("Failed to sync table:", err);
  });


sequelize.authenticate().then( ()=>{
    app.listen(8000 || process.env.PORT, () => {
        console.log("server is running on port " + process.env.PORT);
      });
})
  .catch ((error)=>{
    console.log("failed to connect database", error);
  }) 

  
    

