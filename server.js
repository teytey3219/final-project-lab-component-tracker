require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Borrow = require("./models/Borrow");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// View all records (add ?status=borrowed to show only unreturned items)
app.get("/api/records", async (req, res) => {
  try {
    const filter = req.query.status === "borrowed" ? { returned: false } : {};
    const records = await Borrow.find(filter).sort({ dateBorrowed: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new record
app.post("/api/records", async (req, res) => {
  try {
    const record = await Borrow.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a record (mark returned or change details)
app.put("/api/records/:id", async (req, res) => {
  try {
    const record = await Borrow.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true
    });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a record
app.delete("/api/records/:id", async (req, res) => {
  try {
    const record = await Borrow.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });