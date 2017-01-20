var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var TaskSchema = new Schema({
  task_name: {
    type: String
  },
  description: {
    type: String
  },
  tags: [{
    type: String
  }],
  comments: [
    userID {
      type: Schema.Types.ObjectId,
      ref: "User" 
    },
    text: {
      type: String
    },
    comment_date: { 
      type: Date,
      default: Date.now 
    },
  ],
  due_date: { 
    type: Date,
    default: Date.now 
  },
  list: {
    type: Schema.Types.ObjectId,
    ref: "List" 
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project" 
  }
});

var Task = mongoose.model("Task", TaskSchema);

module.exports = Task;
