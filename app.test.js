const request = require("supertest");
const app = require("./app");
const httpStatusCodes = require("./config/httpStatusCodes.json");
let resp, gameId;

describe("Create a new game", () => {
  test("response code should be 200", async () => {
    resp = await request(app).post("/api/v1/game").send();
    gameId = resp.body._id;
    expect(resp.statusCode).toBe(httpStatusCodes.OK);
  });
  test("Current player should be white", async () => {
    expect(resp.body.currPlayer).toBe("white");
  });
  test("Positions array length should be 32", async () => {
    expect(Object.keys(resp.body.positions).length).toBe(32);
  });
});

describe("Potential Moves", () => {
  describe("Potenial Moves for A2", () => {
    test("Response code 200", async () => {
      resp = await request(app).get(`/api/v1/game/${gameId}/allowedMoves/a2`).send();
      expect(resp.statusCode).toBe(httpStatusCodes.OK);
    });

    test("expect number of moves to be 2", async () => {
      expect(resp.body.length).toBe(2);
    });
    test("expect a4 special move", async () => {
      let moves = resp.body.filter(item => (item.pos = "a4" && item.type === "specialMoves"));
      expect(moves.length).toBe(1);
    });
  });

  describe("Potenial Moves for C4", () => {
    test("Response code 400", async () => {
      resp = await request(app).get(`/api/v1/game/${gameId}/allowedMoves/c4`).send();
      expect(resp.statusCode).toBe(httpStatusCodes.BadRequest);
    });
  });

  describe("Play Game", () => {
    test("Black piece tries to move when White's turn", async () => {
      resp = await request(app).put(`/api/v1/game/${gameId}`).send({
        startPos: "a7",
        endPos: "a6"
      });
      expect(resp.statusCode).toBe(httpStatusCodes.Forbidden);
    });
    test("White make special move", async () => {
      resp = await request(app).put(`/api/v1/game/${gameId}`).send({
        startPos: "a2",
        endPos: "a4"
      });
      expect(resp.statusCode).toBe(httpStatusCodes.OK);
    });
    test("Black makes special move", async () => {
      resp = await request(app).put(`/api/v1/game/${gameId}`).send({
        startPos: "b7",
        endPos: "b5"
      });
      expect(resp.statusCode).toBe(httpStatusCodes.OK);
    });
    test("White attacks", async () => {
      resp = await request(app).put(`/api/v1/game/${gameId}`).send({
        startPos: "a4",
        endPos: "b5"
      });
      expect(resp.statusCode).toBe(httpStatusCodes.OK);
    });
    test("Expect Invalid move", async () => {
      resp = await request(app).put(`/api/v1/game/${gameId}`).send({
        startPos: "a4",
        endPos: "b5"
      });
      expect(resp.statusCode).toBe(httpStatusCodes.BadRequest);
    });
    test("Expect Forbidden move as its Black piece's turn", async () => {
      resp = await request(app).put(`/api/v1/game/${gameId}`).send({
        startPos: "b5",
        endPos: "b6"
      });
      expect(resp.statusCode).toBe(httpStatusCodes.Forbidden);
    });
    test("Pieces other that pawns cannot be moved", async () => {
      resp = await request(app).put(`/api/v1/game/${gameId}`).send({
        startPos: "a8",
        endPos: "a7"
      });
      expect(resp.statusCode).toBe(httpStatusCodes.Forbidden);
    });
  });
});
