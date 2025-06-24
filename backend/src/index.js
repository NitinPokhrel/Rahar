const dotenv = require('dotenv');
dotenv.config()
const {app} = require('./app.js');
const {sequelize} = require('./db/db.js');



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

  
    