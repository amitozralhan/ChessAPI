# Chess as a Service API

## Description

This nodejs app implements Chess as a Service API. The scope is limited to only moving the pawns.

## How to run the app locally

### Prerequisites

1. Nodejs should be installed on the machine.
1. Mongodb should be installed.

### Download and Start App

1. Clone the repository
1. Check port and dbName in Config->dbConfig.json. Update this port if local mongo server is not listening on default port 27017.
1. Start mongo server and ensure the port where it is listening matches the one in dbConfig file.
1. Run npm install. Following external libraries are used:
   1. Mongoose
   1. Express
   1. nodemon (dev dependency for hot load of server)
   1. jest and supertest( for integration testing)
1. Run npm start (app listens are port 3000)

### How to Use

1. I have included ChessAPI.postman_collection.json inside Postman Collection folder which can be imported into Postman. It has all the API end points configured and ready to test.
2. Execute "Create New Game". This will create a new game with default state.
3. Positions are defined in the standard grid system (a1, b8 .. ) as described in instructions. e.g. to check the potential moves for a piece at a2, send the following request:

```
http://{{host}}:{{port}}/api/v1/game/{{gameId}}/allowedMoves/a2
```

# Design

## Game Logic

gameConfig.json file is used to drive the game logic. I did not want to hard code the logic for moving a piece. So this file acts as a dictionary of moves that a piece can make.

```
pawn:{ "normalMoves": { "direction": ["Forward_Vertical"], "maxMoves": { "default": 1 } },
      "attackMoves": { "direction": ["Forward_Left", "Forward_Right"], "maxMoves": { "default": 1 } }}
```

This dictionary is then interpretted in the code. The advantage of this design is that it adds scalability and flexibility. Any changes or additions to how a piece moves does not require additional code, just a change to config file. E.g. If we want to expand the coverage to include Rook, all we need to do is add the following to config file:

```
    "rook": {
      "normalMoves": { "direction": ["Forward_Vertical", "Backward_Vertical", "Horizontal_Left", "Horizontal_Right"], "maxMoves": { "default": 8 } }
    }
```

Note: I have not implemented logic for every possible move.

## DB Schema

- dbmodel.js defines the schemas for all Mongo collections used. This ensures data integrity.
- For every move, only the startPosition and endPosition details are sent to the database. This keeps the data to be updated to a minimum.
- In order to maintain a history of all the moves, I implemented a "pre" hook on the game collection. So everytime the game gets updated, a new document is inserted into the gameAudit collection. This approach has the advantage that we dont need two separate DB calls to maintain the gameState and a history of moves.
