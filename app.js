const express = require("express");
const Game = require("./models/game.js");
const errorCodes = require("./config/errorCodes");
const httpStatusCodes = require("./config/httpStatusCodes.json");

const app = express();
app.use(express.json());

app.post("/api/v1/game", async (req, res) => {
  console.log("creating new game");

  try {
    let game = new Game();
    let data = await game.createGame();
    res.status(httpStatusCodes.OK);
    res.send(data);
  } catch (err) {
    handleError(err, res);
  }
});

app.get("/api/v1/game/:gameId", async (req, res) => {
  try {
    let game = new Game(req.params.gameId);
    let data = await game.getGameState();
    res.status(httpStatusCodes.OK);
    res.send(data);
  } catch (err) {
    handleError(err, res);
  }
});

app.put("/api/v1/game/:gameId", async (req, res) => {
  try {
    let game = new Game(req.params.gameId);
    let data = await game.updateGameState(req.body);
    res.status(httpStatusCodes.OK);
    res.send(data);
  } catch (err) {
    handleError(err, res);
  }
});

app.get("/api/v1/game/:gameId/allowedMoves/:pos", async (req, res) => {
  try {
    let game = new Game(req.params.gameId);
    let data = await game.getPotentialMoves(req.params.pos);
    res.status(httpStatusCodes.OK);
    res.send(data);
  } catch (err) {
    handleError(err, res);
  }
});

app.get("/api/v1/game/:gameId/history", async (req, res) => {
  res.status(httpStatusCodes.Forbidden);
  res.send();
});

const handleError = (err, res) => {
  console.log(err);
  let errDetails = { status: httpStatusCodes.BadRequest, message: "Invalid" };
  errDetails = errorCodes[err] ? errorCodes[err] : errDetails;
  res.status(errDetails.status);
  res.send(`Error: ${errDetails.message}`);
};

module.exports = app;
