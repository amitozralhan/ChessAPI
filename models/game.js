const gameConfig = require("../config/gameConfig.json");
const dbModel = require("./dbModel");
const Db = require("./db");

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.gridHash = {};
    this.potentialMoves = [];
    this.potentialMovesWithType = [];
  }

  getGameState() {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.gameId) {
          throw new Error(`gameId required`);
        }
        console.log(`getting state for gameid: ${this.gameId}`);
        let data = await Db.findObject(dbModel.game, { _id: this.gameId });
        if (data.length === 0) {
          reject(new Error("Invalid game Id"));
        }
        resolve(data);
      } catch (err) {
        reject(new Error(`Invalid game Id`));
      }
    });
  }
  updateGameState(positions) {
    return new Promise(async (resolve, reject) => {
      try {
        const { startPos, endPos } = positions;
        await this.getPotentialMoves(startPos);
        if (this.state.currPlayer !== this.pieceAtStartPos.color) {
          reject({ type: "asda", message: "Other player's turn ", status: 403 });
        } else if (!this.potentialMoves.includes(endPos)) {
          reject({ type: "asda", message: "Invalid Move", status: 403 });
        } else {
          let isAttackMove = this.potentialMovesWithType.filter(item => item.type === "attackMoves")[0];

          let newPlayer = this.state.currPlayer === "white" ? "black" : "white";
          let removePos = { $pull: { positions: { _id: this.pieceAtStartPos._id } } };
          if (isAttackMove) {
            removePos = { $pull: { positions: { _id: { $in: [this.gridHash[startPos]._id, this.gridHash[endPos]._id] } } } };
          }
          let insertPos = { $push: { positions: { pieceType: this.pieceAtStartPos.pieceType, color: this.state.currPlayer, position: endPos } }, $set: { currPlayer: newPlayer } };

          let promiseArr = [];
          promiseArr.push(Db.updateObject(dbModel.game, { _id: this.gameId }, insertPos));
          promiseArr.push(Db.updateObject(dbModel.game, { _id: this.gameId }, removePos));
          Promise.all(promiseArr).then(() => resolve(true));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  createDefaultState() {
    const stateConfig = gameConfig.defaultState;
    const state = { currPlayer: stateConfig.currPlayer, positions: [] };
    Object.entries(stateConfig.positions).forEach(([pieceType, value]) => {
      Object.entries(value).forEach(([color, pos]) => {
        for (let position of pos) {
          state.positions.push({ pieceType, color, position });
        }
      });
    });
    return state;
  }

  createGame() {
    return new Promise(async (resolve, reject) => {
      try {
        this.state = this.createDefaultState();
        let data = await Db.addObject(dbModel.game, this.state);
        this.gameId = data._id;
        resolve(data);
      } catch (err) {
        console.log("error in gamejs");
        reject(err);
      }
    });
  }
  resolveMovePerDirection(dir, maxMoves, currCol, currRow, pieceAtPos, moveType) {
    let movesPerDirection = [];

    for (let i = 0; i < maxMoves; i++) {
      switch (dir) {
        case "Forward_Vertical":
          currRow = pieceAtPos.color === "white" ? Math.min(gameConfig.boardConfig.maxRow, currRow + 1) : Math.max(gameConfig.boardConfig.minRow, currRow - 1);
          break;
        case "Backward_Vertical":
          currRow = pieceAtPos.color === "white" ? Math.max(gameConfig.boardConfig.minRow, currRow - 1) : Math.min(gameConfig.boardConfig.maxRow, currRow + 1);
          break;
        case "Forward_Left":
          currRow = pieceAtPos.color === "white" ? Math.min(gameConfig.boardConfig.maxRow, currRow + 1) : Math.max(gameConfig.boardConfig.minRow, currRow - 1);
          currCol = pieceAtPos.color === "white" ? String.fromCharCode(currCol.charCodeAt(0) - 1) : String.fromCharCode(currCol.charCodeAt(0) + 1);
          break;
        case "Forward_Right":
          currRow = pieceAtPos.color === "white" ? Math.min(gameConfig.boardConfig.maxRow, currRow + 1) : Math.max(gameConfig.boardConfig.minRow, currRow - 1);
          currCol = pieceAtPos.color === "white" ? String.fromCharCode(currCol.charCodeAt(0) + 1) : String.fromCharCode(currCol.charCodeAt(0) - 1);
          break;
      }
      let newPos = `${currCol}${currRow}`;

      if (!this.gridHash[newPos] && moveType !== "attackMoves") {
        movesPerDirection.push(newPos);
      } else if (this.gridHash[newPos] && this.gridHash[newPos].color !== pieceAtPos.color && moveType === "attackMoves") {
        movesPerDirection.push(newPos);
      } else {
        break; // if the board is blocked by another piece then break
      }
    }
    return movesPerDirection;
  }

  getPotentialMoves(pos) {
    return new Promise(async (resolve, reject) => {
      try {
        let gameData = await this.getGameState();
        this.state = gameData[0];
        const pieceAtPos = this.state.positions.filter(item => item.position === pos)[0];
        if (!pieceAtPos) {
          reject(new Error(`no piece found at position:${pos}`));
        } else if (pieceAtPos.pieceType !== "pawn") {
          reject(new Error(`Invalid pieceTypes`));
        } else {
          this.pieceAtStartPos = pieceAtPos;
          this.state.positions.forEach(row => {
            this.gridHash[row.position] = { color: row.color, pieceType: row.pieceType, _id: row._id };
          });
          const moveRules = gameConfig.moveRules[this.pieceAtStartPos.pieceType];

          ["normalMoves", "attackMoves", "specialMoves"].forEach(moveType => {
            if (moveRules[moveType]) {
              let processMoveType = true;
              let [currCol, currRow] = pos.split("");
              let color = this.pieceAtStartPos.color;
              currRow = parseInt(currRow);

              ///// resolve the conditional logic for a type of move
              if (moveRules[moveType].condition) {
                processMoveType = false;
                let conditionStatus = [];
                for (let con of moveRules[moveType].condition.conditions) {
                  let conditionSatisfied = true;
                  Object.entries(con).forEach(([key, value]) => {
                    if (value !== eval(key)) {
                      conditionSatisfied = false;
                    }
                  });
                  conditionStatus.push(conditionSatisfied);
                }
                let count = 0;
                conditionStatus.forEach(item => {
                  if (item) {
                    ++count;
                  }
                });
                if (moveRules[moveType].condition.operand === "OR" && count > 0) {
                  processMoveType = true;
                }
                if (moveRules[moveType].condition.operand === "AND" && count === conditionStatus.length) {
                  processMoveType = true;
                }
              }

              // resolve the potential moves for each direction described in config file
              moveRules[moveType].direction.forEach(dir => {
                if (processMoveType) {
                  let maxMoves = moveRules[moveType].maxMoves[dir] || moveRules[moveType].maxMoves.default;
                  let movePerMoveTypePerDir = this.resolveMovePerDirection(dir, maxMoves, currCol, currRow, this.pieceAtStartPos, moveType);
                  movePerMoveTypePerDir.forEach(move => {
                    if (!this.potentialMoves.includes(move)) {
                      this.potentialMovesWithType.push({ pos: move, type: moveType });
                      this.potentialMoves.push(move);
                    }
                  });
                }
              });
            }
          });

          resolve(this.potentialMovesWithType);
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Game;
