const mongoose = require("mongoose");

const borrowSchema = new mongoose.Schema({
  componentName: { type: String, required: true },
  borrowerName: { type: String, required: true },
  dateBorrowed: { type: Date, required: true },
  returned: { type: Boolean, default: false },
  dateReturned: { type: Date }
});

module.exports = mongoose.model("Borrow", borrowSchema);