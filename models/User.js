var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  user_name: {
    type: String
  },
  email: {
    type: String
  },
  password: {
    type: String
  },
  teams: [{
    type: Schema.Types.ObjectId,
    ref: "Team" 
  }]
});

var User = mongoose.model("User", UserSchema);

module.exports = User;
