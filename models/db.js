const mongoose = require("mongoose");
const dbConfig = require("../config/dbConfig.json");
const dbRoute = `mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.dbName}`;

mongoose.connect(dbRoute);
const db = mongoose.connection;
db.once("open", () => console.log(`connected to database`));
db.on("error", () => console.log("unable to connect to database"));

class Db {
  static addObject(model, data) {
    return new Promise((resolve, reject) => {
      const obj = new model(data);
      obj.save((err, data) => {
        if (err) {
          console.log("error in db.js");
          reject(err);
        } else {
          console.log({ data });
          resolve(data);
        }
      });
    });
  }
  static async updateObject(model, searchParams, data) {}
}

module.exports = Db;
