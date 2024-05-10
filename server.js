var express = require('express');
const axios = require("axios");
require('dotenv').config();
var app = express();
var bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var cors = require('cors');
const util = require( 'util' );
var server = require('http').createServer(app);
var port = 443;
var io = require('socket.io')(server);
axios.defaults.headers.common["Authorization"] = process.env.SECRETCODE;
gameSocket = null;
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(__dirname + "/build"));
app.get("/*", function (req, res) {
    res.sendFile(__dirname + "/build/index.html", function (err) {
        if (err) {
            res.status(500).send(err);
        }
    });
});

server.listen(port, function(){
	console.log("server is running on " + port);
});


// Implement socket functionality
gameSocket = io.on('connection', function(socket){
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
    
    socket.on('bet info', async(req) => {
      var random_Num;
      var betResult =[];
      var betAmount;
      var amount;

      console.log(req);
      betAmount = req.betAmount;
      amount = req.amount;
      amount -= betAmount;
      try {
        try{
          await axios.post(process.env.PLATFORM_SERVER + "api/games/bet", {
              token: req.token,
              amount: req.betAmount
          });
        }catch{
          throw new Error("Bet Error!")
        }

        random_Num = getRandomInt(9998);
        betResult = await gameResult(req.stateFlag,random_Num,req.compareNum, req.chance, req.betAmount, amount, req.token);
        console.log(betResult)
        socket.emit("bet result",betResult)
      } catch (err) {
          socket.emit("error message", {"errMessage":err.message})
      }      
    });

    console.log('socket connected: ' + socket.id);
    socket.emit('connected', {});
  });  
  

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  async function gameResult (stateFlag, randomNum, compareNum, chance, betAmount, amount, userToken){
    var _amount = amount;
    var earnAmount;
    var game_Result;
    var betResult;
    if(stateFlag==0){
      if(randomNum>compareNum){
        earnAmount = betAmount*(95/chance).toFixed(4);
        game_Result=true;
        _amount += earnAmount;
        try {
          await axios.post(process.env.PLATFORM_SERVER + "api/games/winlose", {
              token: userToken,
              amount: earnAmount,
              winState: true
          });
        } catch {
          throw new Error("Can't find server!")
        }
      }
      else if(randomNum<=compareNum){
        earnAmount=0;
        game_Result=false;
      }
      betResult = {"amount":_amount,"gameResult":game_Result,"earnAmount":earnAmount,"randomNumber":randomNum}
    }
    else if(stateFlag==1){
      if(randomNum<compareNum){
        earnAmount = betAmount*(95/chance).toFixed(4);
        game_Result=true;
        _amount += earnAmount;
        try {
          await axios.post(process.env.PLATFORM_SERVER + "api/games/winlose", {
              token: userToken,
              amount: earnAmount,
              winState: true
          });
        } catch{
          throw new Error("Can't find server!")
        }
      }
      else if(randomNum>=compareNum){
        earnAmount=0;
        game_Result=false;
      }
      betResult = {"amount":_amount,"gameResult":game_Result,"earnAmount":earnAmount,"randomNumber":randomNum}
    }
    return betResult;
  }