const httpStatusCodes = require("./httpStatusCodes.json");
module.exports = {
  Empty_Position: { status: httpStatusCodes.BadRequest, message: "No Piece found at this position." },
  Invalid_Piece_Type: { status: httpStatusCodes.Forbidden, message: "Not allowed to move this piece." },
  Initiation_Error: { status: httpStatusCodes.ServerError, message: "Could not create a new game." },
  Turn_Error: { status: httpStatusCodes.Forbidden, message: "Other player's turn" },
  Invalid_Move: { status: httpStatusCodes.Forbidden, message: "Move not valid" },
  Update_Game_Error: { status: httpStatusCodes.ServerError, message: "Could not update the game." },
  Invalid_Position: { status: httpStatusCodes.BadRequest, message: "This is an invalid postion for this game." },
  DB_Error: { status: httpStatusCodes.ServerError, message: "Could not create a new game." }
};
