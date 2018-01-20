var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var express = require('express');
var bcrypt = require('bcrypt');

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

mongoose.connect("mongodb://test:test@ds257077.mlab.com:57077/todose")

var AccountSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

var ParkSchema = mongoose.Schema({
  longitude:{
    type: Number,
    required: true
  },
  latitude:{
    type:Number,
    required: true
  },
  time:{
    type: Date,
    default: Date.now
  }
});

AccountSchema.pre('save',function(next){
  var user = this;
  bcrypt.hash(user.password,10,function(err,hash){
    if(err) throw err;
    user.password = hash;
    next();
  });
});

var Park = mongoose.model('Park',ParkSchema);

var Account = mongoose.model("Account", AccountSchema);

//index
app.get('/',function(req,res){
  res.sendFile(__dirname + "/map.html");
});

//Get ALL Car Park (development)
app.get("/api/parks",function(req,res){
  Park.find({}).exec(function(err,data){
    if(err) throw err;
    res.json(data);
  })
});

//Getting the Car Parks within the range
app.get("/api/:long/:lat",function(req,res){
  let long = +req.params.long;
  let lat = +req.params.lat;
  Park.find({
    longitude:{
      $gt: long - .001,
      $lt: long + .001
    },
    latitude:{
      $gt: lat - .001,
      $lt: lat + .001
    }
  }).exec(function(err,data){
    if(err) throw err;
    res.json(data);
  });
});

//Posting the the new data onto the car park
app.post("/api/add",function(req,res){
  var park = req.body;
  Park(park).save(function(err,data){
    if(err) throw err;
    res.json(data);
  });
});

//Removing a park space after the user claims park
app.delete("/api/remove",function(req,res){
  var park = req.body;
  var lat = park.latitude;
  var long = park.longitude;
  Park.remove({longitude:long, latitude,lat},function(err){
    if(err) throw err;
  });
});

//Login Data sent through HTTP Post request
app.post("/api/login",function(req,res){
  var credentials = req.body;
  Account.findOne({username:credentials.username}).exec(function(err,data){
    if(err) throw err;
    if(!data) res.json({sucess:false})
    else{
      bcrypt.compare(credentials.password,data.password,function(err,re){
        if(err) throw err;
        res.json({success:re});
      });
    }
  });
});

//Registration data sent through HTTP Post request
app.post("/api/register",function(req,res){
  var credentials = req.body;
  Account.findOne({username: credentials.username}).exec(function(err,data){
    if(err) throw err;
    let result = true;
    if(!data){
      Account(credentials).save(function(err){
        if(err) throw err;
      });
    } else result = false;
    res.json({success:result});
  });

})

var port = process.env.PORT || 3000;

app.listen(port,() => {
  console.log("Listening to port " + port );
});
