const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config()

const port = 5000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lr5ds.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

var serviceAccount = require("./configs/volunteer-network90-firebase-adminsdk-g917c-baf5cb2934.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express()
app.use(cors());
app.use(bodyParser.json());

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const registersCollection = client.db("volunteer").collection("registeredInfo");
  const networksCollection = client.db("volunteer").collection("networks");
  
  app.post('/addRegister', (req,res) =>{
      const newRegister = req.body;
      registersCollection.insertOne(newRegister)
      .then(result => {
          res.send(result.insertedCount > 0)
      })
      console.log(newRegister)
  })

  app.post('/addNetwork', (req,res) =>{
      const newNetwork = req.body;
      console.log(newNetwork);
      networksCollection.insertMany(newNetwork)
      .then(result => {
        // console.log(result.insertedCount);
          res.send(result.insertedCount)
      })
  })

  app.get('/networks', (req,res) => {
    networksCollection.find({})
    .toArray( (err, documents) =>{
      res.send(documents);
    })
  })

  app.get('/network/:id', (req,res) => {
    networksCollection.find({id: req.params.id})
    .toArray( (err, documents) =>{
      res.send(documents[0]);
    })
  })
   
  app.get('/registrations', (req,res) =>{
      const bearer = req.headers.authorization;
      if(bearer && bearer.startsWith('Bearer ')){
        const idToken = bearer.split(' ')[1];
        console.log({idToken});
        // idToken comes from the client app
        admin
          .auth()
          .verifyIdToken(idToken)
          .then((decodedToken) => {
            const tokenEmail = decodedToken.email;
            const queryEmail = req.query.email;
            console.log(tokenEmail, queryEmail);
            if(tokenEmail == queryEmail){
              registersCollection.find({email: queryEmail})
              .toArray((err,documents) =>{
                  res.status(200).send(documents)
              })
            }
            else{
              res.status(401).send('Unauthorized User');
            }
            // ...
          })
          .catch((error) => {
            res.status(401).send('Unauthorized User');
          });
      }
      else{
        res.status(401).send('Unauthorized User');
      }
  })
});



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(process.env.PORT || port)