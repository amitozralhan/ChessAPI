const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//game holds the current player and the state of the game. Game State is an array of type

const pieceSchema = new Schema({
  pieceType: {
    type: String,
    enum: ["king", "queen", "bishop", "knight", "rook", "pawn"],
    required: true
  },
  color: { type: String, enum: ["black", "white"], required: true }
});

const gameSchema = new Schema({
  currPlayer: { type: String, enum: ["black", "white"], required: true },
  positions: {
    type: Map,
    of: pieceSchema
  }
});

// gameHistory schema. Implemented as a hook on game collection. Any time the game collection is updated, a document will be inserted into this collection.

const gameHistorySchema = new Schema({
  startPos: String,
  endPos: String,
  timestamp: { type: Date, required: true },
  player: { type: String, enum: ["black", "white"], required: true },
  gameId: { type: Schema.Types.ObjectId, ref: "game" }
});

gameSchema.pre("findOneAndUpdate", async function (next) {
  // <TODO> insert logic for game history
  let gameId = this._conditions._id;
  let moveData = { gameId: gameId, player: this._update.currPlayer, timestamp: new Date() };
  Object.keys(this._update).forEach(key => {
    if (!this._update[key]) {
      moveData.startPos = key.split(".")[1];
    } else if (key.split(".")[0] === "positions") {
      moveData.endPos = key.split(".")[1];
    }
  });
  new gameAudit(moveData).save();
});

const game = mongoose.model("game", gameSchema);
const gameAudit = mongoose.model("gameAudit", gameHistorySchema);

module.exports = {
  game
};
