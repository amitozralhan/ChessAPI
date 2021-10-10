const mongoose = require("mongoose");
const dbConfig = require("../config/dbConfig.json");
const dbRoute = `mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.dbName}`;

mongoose.connect(dbRoute, { useNewUrlParser: true });

const db = mongoose.connection;
db.once("open", () => console.log(`connected to database`));
db.on("error", () => console.log("unable to connect to database"));

class Db {
  static addObject(model, data) {
    return new Promise((resolve, reject) => {
      const obj = new model(data);
      obj.save((err, data) => {
        if (err) {
          console.log("DB_Error");
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  static async updateObject(model, searchParams, data) {
    return new Promise(async (resolve, reject) => {
      try {
        const updatedData = await model.findOneAndUpdate(searchParams, data, { useFindAndModify: false, new: true });
        resolve(updatedData);
      } catch (err) {
        reject(err);
      }
    });
  }

  static async findObject(model, searchParams) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await model.find(searchParams);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Db;
