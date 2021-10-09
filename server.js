const express = require("express");
const Game = require("./models/game.js");

const app = express();

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

app
  .route("/game/:gameId")
  .get(async (req, res) => {
    res.send(`getting game state for ${req.params.gameId}`);
  })
  .put(async (req, res) => {
    res.send(`updating game state for ${req.params.gameId}. body:${req.body}`);
  });

app.get("/game/:gameId/allowedMoves/:pos", async (req, res) => {
  res.send(`getting allowed moves for game :${req.params.gameId} for position:${req.params.pos} `);
});

app.get("/game/:gameId/history", async (req, res) => {
  res.send("history");
});

const handleError = (err, res) => {
  console.log("error in server");
  console.log(err.message);
  res.status(400);
  res.send(`Error: ${err.message}`);
};

app.listen(3000, () => {
  console.log("listening on 3000");
});
