const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ij5kp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();

    const inventoryCollection = await client
      .db("service")
      .collection("products");

    app.get("/inventory", async (req, res) => {
      const query = {};
      const cursor = await inventoryCollection.find(query);
      const inventoryList = await cursor.toArray();

      res.send(inventoryList);
    });

    app.get("/inventory/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { _id: ObjectId(id) };
      const inventoryItem = await inventoryCollection.findOne(filter);

      res.send(inventoryItem);
    });
  } finally {
  }
};

run().catch(console.dir);

app.listen(port, () => console.log("listening at ", port));
