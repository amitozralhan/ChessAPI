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

// gameHistory schema. Implemented as a hook on game collection. Any time the game collection is updated, this object will be populated.

const gameHistorySchema = new Schema({
  startPos: String,
  endPos: String,
  timestamp: { type: Date, required: true },
  player: { type: String, enum: ["black", "white"], required: true }
});

gameHistorySchema.virtual("game", {
  ref: "game",
  localField: "gameID",
  foreignField: "_id"
});

gameSchema.pre("findOneAndUpdate", async function (next) {
  // <TODO> insert logic for game history
  let data = this._update;
  console.log({ data });
});

const game = mongoose.model("game", gameSchema);
module.exports = {
  game
};
