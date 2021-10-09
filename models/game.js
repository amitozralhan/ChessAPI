const gameConfig = require("../config/gameConfig.json");
const dbModel = require("./dbModel");
const Db = require("./db");

class Game {
  constructor(state) {
    console.log(state);
    this.state = state ? state : gameConfig.defaultState;
    console.log(this.state);
  }
  createGame() {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await Db.addObject(dbModel.game, this.state);
        resolve(data);
      } catch (err) {
        console.log("error in gamejs");
        reject(err);
      }
    });
  }
}

module.exports = Game;
