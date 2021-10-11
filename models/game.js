const gameConfig = require("../config/gameConfig.json");
const dbModel = require("./dbModel");
const Db = require("./db");

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.state = {};
  }

  getGameState() {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.gameId) {
          throw "Missing_GameID";
        }
        let data = await Db.findObject(dbModel.game, { _id: this.gameId });
        if (data.length === 0) {
          reject("Invalid_GameID");
        }
        resolve(data);
      } catch (err) {
        reject("Invalid_GameID");
      }
    });
  }
  updateGameState(positions) {
    return new Promise(async (resolve, reject) => {
      try {
        const { startPos, endPos } = positions;
        if (!(startPos && endPos)) {
          reject("Missing_Positions");
        }
        let potentialMovesWithType = await this.getPotentialMoves(startPos);
        let pieceAtStartPos = this.getPieceAtPos(startPos);

        if (this.state.currPlayer !== pieceAtStartPos.color) {
          reject("Turn_Error");
        } else if (!potentialMovesWithType.filter(item => item.pos === endPos)[0]) {
          reject("Invalid_Move");
        } else {
          let isAttackMove = false;
          const possibleAttackMoves = potentialMovesWithType.filter(item => item.type === "attackMoves");
          for (let mv of possibleAttackMoves) {
            if (mv.pos === endPos) {
              isAttackMove = true;
              break;
            }
          }
          let updateData = { currPlayer: this.state.currPlayer === "white" ? "black" : "white" };
          updateData[`positions.${startPos}`] = null;
          updateData[`positions.${endPos}`] = pieceAtStartPos;
          let data = await Db.updateObject(dbModel.game, { _id: this.gameId }, updateData);
          resolve(data);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  createGame() {
    return new Promise(async (resolve, reject) => {
      try {
        this.state = gameConfig.defaultState;
        let data = await Db.addObject(dbModel.game, this.state);
        this.gameId = data._id;
        resolve(data);
      } catch (err) {
        reject("Initiation_Error");
      }
    });
  }

  resolveMovePerDirection(dir, maxMoves, currCol, currRow, pieceAtPos, moveType) {
    let movesPerDirection = [];
    for (let i = 0; i < maxMoves; i++) {
      switch (dir) {
        case "Forward_Vertical":
          currRow = pieceAtPos.color === "white" ? currRow + 1 : currRow - 1;
          currCol = currCol.charCodeAt(0); // converting to charcode representations to perform mathematical operations.
          break;
        case "Backward_Vertical":
          currRow = pieceAtPos.color === "white" ? currRow - 1 : currRow + 1;
          currCol = currCol.charCodeAt(0);
          break;
        case "Forward_Left":
          currRow = pieceAtPos.color === "white" ? currRow + 1 : currRow - 1;
          currCol = pieceAtPos.color === "white" ? currCol.charCodeAt(0) - 1 : currCol.charCodeAt(0) + 1;
          break;
        case "Forward_Right":
          currRow = pieceAtPos.color === "white" ? currRow + 1 : currRow - 1;
          currCol = pieceAtPos.color === "white" ? currCol.charCodeAt(0) + 1 : currCol.charCodeAt(0) - 1;
          break;
      }
      if (
        // check if the positions are within the bounds of the board
        gameConfig.boardConfig.minRow <= currRow &&
        currRow <= gameConfig.boardConfig.maxRow &&
        currCol <= gameConfig.boardConfig.maxCol.charCodeAt(0) &&
        currCol >= gameConfig.boardConfig.minCol.charCodeAt(0)
      ) {
        currCol = String.fromCharCode(currCol);
        let newPos = `${currCol}${currRow}`;
        if (!this.state.positions.get(newPos) && moveType !== "attackMoves") {
          movesPerDirection.push(newPos);
        } else if (this.state.positions.get(newPos) && this.state.positions.get(newPos).color !== pieceAtPos.color && moveType === "attackMoves") {
          movesPerDirection.push(newPos);
        } else {
          break; // if the board is blocked by another piece then break
        }
      }
    }
    return movesPerDirection;
  }

  getPieceAtPos(pos) {
    const pieceAtPos = this.state.positions.get(pos);
    if (!pieceAtPos) {
      throw "Empty_Position";
    } else if (!gameConfig.allowedPieceTypes.includes(pieceAtPos.pieceType)) {
      throw "Invalid_Piece_Type";
    }
    return pieceAtPos;
  }
  resolveMoveTypeCondition(moveRules, moveType, currCol, currRow, pieceAtPos) {
    let processMoveType = true;
    if (moveRules[moveType].condition) {
      let color = pieceAtPos.color;
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
    return processMoveType;
  }
  getPotentialMoves(pos) {
    return new Promise(async (resolve, reject) => {
      try {
        const potentialMovesWithType = [];
        const potentialMoves = [];
        let gameData = await this.getGameState();
        this.state = gameData[0];
        const pieceAtPos = this.getPieceAtPos(pos);
        if (pieceAtPos) {
          const moveRules = gameConfig.moveRules[pieceAtPos.pieceType];
          ["attackMoves", "normalMoves", "specialMoves"].forEach(moveType => {
            if (moveRules[moveType]) {
              let [currCol, currRow] = pos.split("");
              currRow = parseInt(currRow);
              let processMoveType = this.resolveMoveTypeCondition(moveRules, moveType, currCol, currRow, pieceAtPos);
              moveRules[moveType].direction.forEach(dir => {
                if (processMoveType) {
                  let maxMoves = moveRules[moveType].maxMoves[dir] || moveRules[moveType].maxMoves.default;
                  let movePerMoveTypePerDir = this.resolveMovePerDirection(dir, maxMoves, currCol, currRow, pieceAtPos, moveType);
                  movePerMoveTypePerDir.forEach(move => {
                    if (!potentialMoves.includes(move)) {
                      potentialMovesWithType.push({ pos: move, type: moveType });
                      potentialMoves.push(move);
                    }
                  });
                }
              });
            }
          });
          resolve(potentialMovesWithType);
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Game;
