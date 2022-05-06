const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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

const verifyJWT = async (req, res, next) => {
  const { auth } = req.headers;
  if (!auth) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  await jwt.verify(auth, process.env.PRIVATE_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send({ err });
    }
    req.decoded = decoded;
  });
  next();
};

const run = async () => {
  try {
    await client.connect();

    const inventoryCollection = await client
      .db("service")
      .collection("products");

    // JWT Auth

    app.post("/gettoken", async (req, res) => {
      if (req.query.email) {
        const { email } = req.query;
        return jwt.sign(
          { email },
          process.env.PRIVATE_KEY,
          {
            expiresIn: "1d",
          },
          (err, token) => res.send({ token })
        );
      } else res.status(400).send({ message: "Please provide valid email" });
    });

    app.get("/inventory", async (req, res) => {
      const query = {};
      const cursor = await inventoryCollection.find(query);
      const inventoryList = await cursor.toArray();

      res.send(inventoryList);
    });

    app.get("/inventory/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const inventoryItem = await inventoryCollection.findOne(query);
      res.send(inventoryItem);
    });

    // Filter by email
    app.get("/myinventory", verifyJWT, async (req, res) => {
      const emailDecode = req.decoded.email;
      const { email } = req.query;
      if (email !== "undefined") {
        if (emailDecode === email) {
          const filter = { email };
          const cursor = await inventoryCollection.find(filter);
          const inventoryList = await cursor.toArray();

          res.send(inventoryList);
        } else res.status(403).send({ message: "Forbidden access" });
      } else res.status(400).send({ message: "Please provide valid email" });
    });

    app.post("/updateinventory/:id", verifyJWT, async (req, res) => {
      const emailDecode = req.decoded.email;
      const { email } = req.query;

      const { id } = req.params;
      const { quantity, sold } = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const update = {
        $set: { quantity, sold },
      };
      if (email !== "undefined") {
        if (email === emailDecode) {
          const result = await inventoryCollection.updateOne(
            filter,
            update,
            options
          );
          res.send(result);
        } else res.status(403).send({ message: "Forbidden access" });
      } else res.status(400).send({ message: "Please provide valid email" });
    });

    app.post("/addinventory", verifyJWT, async (req, res) => {
      const emailDecode = req.decoded.email;
      const { email } = req.query;

      const { body } = req;
      if (email !== "undefined") {
        if (email === emailDecode) {
          const result = await inventoryCollection.insertOne(body);
          res.send(result);
        } else res.status(403).send({ message: "Forbidden access" });
      } else res.status(400).send({ message: "Please provide valid email" });
    });

    app.delete("/delete/:id", verifyJWT, async (req, res) => {
      const emailDecode = req.decoded.email;
      const { email } = req.query;
      const { id } = req.params;

      const query = { _id: ObjectId(id) };
      if (email !== "undefined") {
        if (email === emailDecode) {
          const result = await inventoryCollection.deleteOne(query);
          res.send(result);
        } else res.status(403).send({ message: "Forbidden access" });
      } else res.status(400).send({ message: "Please provide valid email" });
    });
  } finally {
  }
};

run().catch(console.dir);

app.listen(port, () => console.log("listening at ", port));
