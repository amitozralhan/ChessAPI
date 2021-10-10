const express = require("express");
const Game = require("./models/game.js");

const app = express();
app.use(express.json());

app.post("/game", async (req, res) => {
  console.log("creating new game");

  try {
    let game = new Game();
    let data = await game.createGame();
    res.status(200);

    res.send(data);
  } catch (err) {
    handleError(err, res);
  }
});

app.get("/game/:gameId", async (req, res) => {
  try {
    let game = new Game(req.params.gameId);
    let data = await game.getGameState();
    res.status(200);
    res.send(data);
  } catch (err) {
    handleError(err, res);
  }
});

app.put("/game/:gameId", async (req, res) => {
  try {
    let game = new Game(req.params.gameId);
    let data = await game.updateGameState(req.body);
    res.status(200);
    res.send(data);
  } catch (err) {
    handleError(err, res);
  }
});

app.get("/game/:gameId/allowedMoves/:pos", async (req, res) => {
  try {
    let game = new Game(req.params.gameId);
    let data = await game.getPotentialMoves(req.params.pos);
    res.status(200);
    res.send(data);
  } catch (err) {
    handleError(err, res);
  }
});

app.get("/game/:gameId/history", async (req, res) => {
  res.send("history");
});

const handleError = (err, res) => {
  let responseStatus = err.status || 400;
  res.status(responseStatus);
  res.send(`Error: ${err.message}`);
};

app.listen(3000, () => {
  console.log("listening on 3000");
});
