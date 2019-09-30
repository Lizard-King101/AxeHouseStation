import {pointsProcess, lerp, createPoint, updatePoint, deletePoint, toScreenPos, renderPoint} from './points-track';

export function Target() {
}
Target.prototype = {
  preload: function () {
    this.load.image('ball', 'assets/game_assets/sprites/pangball.png');
  },
  create: function () {
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    this.stage.backgroundColor = '#0072bc';
    //this.fps = this.game.add.text(30,30, "FPS: ", { font: 'bold 10pt Arial', fill: 'white', align: 'left' });
    this.pigs = [];
    this.points = {};
    this.graphics = this.game.add.graphics(0,0);
    this.once = true;
    this.boardColors = ["E6FB04", "FF3300", "33FF00", "00FFFF"];
    this.Objects = [];

    this.cpText = this.game.add.text(10, 100, "Player 1" , { font: "bold 16px Arial", fill: "#fff", align: "left" });
    this.cpText.anchor.setTo(0, 0);
    this.cppText = this.game.add.text(10, 100, "0" , { font: "bold 16px Arial", fill: "#fff", align: "center" });
    this.cppText.anchor.setTo(0.5, 0);
    this.crText = this.game.add.text(10, 100, "Round 1" , { font: "bold 16px Arial", fill: "#fff", align: "right" });
    this.crText.anchor.setTo(1, 0);
    // game vars

    this.currentPlayer = 0;
    this.currentRound = 0;
    this.totalRounds = 7;
    this.players = [];
    this.gameWon = false;

    this.pointToHit = 200;
    this.pointSensitivity = 5;
    this.pointHitRadius = 50;

    this.plankCount = 4;
    this.boardSize = 75;
    this.boardSizeAdjust = {
      x: 0,
      y: 0
    }
    this.boardPositionAdjust = {
      x: 0,
      y: 0
    }

    this.playArea = {
      pos: {
        x: 0,
        y: 0
      },
      size: {
        x: 0,
        y: 0
      }
    }
    this.pointtoClick = 1000;

    // end game vars
    this.BoardResize();

  },
  update: function () {
    // clear screen of raw visuals
    if(this.game.settingsResize) {
      this.BoardResize();
      this.game.settingsResize = false;
    } 
    this.graphics.clear();

    this.graphics.beginFill('0x00CCFF');
    this.graphics.drawRect(this.playArea.pos.x, this.playArea.pos.y, this.playArea.size.x, this.playArea.size.y);
    this.graphics.endFill();

    this.Objects.forEach((object, i)=>{
      object.render();
    });

    if (this.game.input.activePointer.leftButton.isDown) {
      let mousePos = {x: this.game.input._x, y: this.game.input._y};
      if(!this.points['cursor']) this.createPoint('cursor', mousePos);
      else this.updatePoint('cursor', mousePos); 
    }else if(this.points['cursor']){
      this.deletePoint('cursor');
    }

    // if frame data from backend Computer Vision process points
    if(this.game.frameData){
      this.pointsProcess();
      //this.fps.text = "FPS: " + Math.round(this.game.frameData.fps);
    }
  },
  resize: function(){
    this.BoardResize();
  },
  BoardResize: function (){
    this.Objects.forEach((object)=>{object.destroy ? object.destroy() : null});
    this.Objects = [];

    if(this.game.playerCount != this.players.length){this.players = [];}
    if(this.players.length < this.game.playerCount){
      for(let i = 0; i < this.game.playerCount; i++){
        let player = new this.Player();
        this.players.push(player);
      }
    }

    let width = this.game.width > this.game.height;
    this.playArea.size = {
      x: (width ? this.game.height * (this.game.boardSize / 100) : this.game.width * (this.game.boardSize / 100)) + this.game.boardSizeAdjust.x ,
      y: (width ? this.game.height * (this.game.boardSize / 100) : this.game.width * (this.game.boardSize / 100)) + this.game.boardSizeAdjust.y 
    }
    this.playArea.pos = {
      x: (this.game.width / 2 - this.playArea.size.x / 2) + this.game.boardPositionAdjust.x,
      y: (this.game.height / 2 - this.playArea.size.y / 2) + this.game.boardPositionAdjust.y
    }

    this.cpText.x = this.playArea.pos.x;
    this.cpText.y = this.playArea.pos.y - 20;
    this.cppText.x = this.playArea.pos.x + this.playArea.size.x / 2;
    this.cppText.y = this.playArea.pos.y - 20;
    this.crText.x = this.playArea.pos.x + this.playArea.size.x;
    this.crText.y = this.playArea.pos.y - 20;

    let tPos = {
      x: this.playArea.pos.x + this.playArea.size.x / 2,
      y: this.playArea.pos.y + this.playArea.size.y / 2
    }
    let tR = (this.playArea.size.x < this.playArea.size.y ? this.playArea.size.x : this.playArea.size.y) - 20 ;
    console.log('Play Size: '+ this.playArea.size.y);
    for(let i = 5; i > 0; i --){
      let ring = new this.Ring();
      let r = this.playArea.size.y * ([0.0832,0.250,0.40,0.5832,0.75])[i - 1];
      console.log('Ring #'+i+': '+r)
      ring.init({
        scene: this,
        pos: tPos,
        textPos: {
          x: tPos.x, 
          y: tPos.y - (r/2 - 30)
        },
        r,
        stroke: this.playArea.size.y * 0.0179,
        points: ([6, 4, 3, 2, 1])[i-1],
        color: (["0xFF0000","0xFFFFFF","0xFFFFFF","0xFFFFFF","0xFFFFFF"])[i -1]
      });
      this.Objects.push(ring);
    }



    let home = new this.Home();
    home.init({scene: this});
    this.Objects.push(home);

    let reset = new this.Reset();
    reset.init({scene: this});
    this.Objects.push(reset);
  },
  givePoints: function (points) {
    console.log("Give Player: " +points+ " points");
    if(points){
      this.players[this.currentPlayer].points += points;
    }
    if(this.currentPlayer + 1 > this.players.length - 1){
      // reset next round
      this.currentPlayer = 0;
      if(this.currentRound + 1 > this.totalRounds){
        // find who one
      }else{
        this.currentRound += 1;
      }
    }else{
      this.currentPlayer += 1;
    }

    // update text
    this.cpText.setText("Player "+ (this.currentPlayer + 1));
    this.cppText.setText(this.players[this.currentPlayer].points);
    this.crText.setText("Round "+ (this.currentRound + 1));
  },
  Player: function (){
    this.points = 0;
    this.init = (options) => {
      Object.keys(options).forEach((key)=>{ this[key] = options[key]; });
    }
  },
  resetGame: function(){
    this.gameOnce = false;
    this.gameWon = false;
    this.currentPlayer = 0;
    this.currentRound = 0;
    if(this.wonText) this.wonText.destroy();
    this.cpText.setText("Player " + (this.currentPlayer + 1));
    this.cppText.setText("0");
    this.crText.setText("Round "+ (this.currentRound + 1));
    this.players = [];
    this.BoardResize();
  },
  Reset: function () {
    this.r = 100
    this.pos = {
      x: 0,
      y: 0
    }
    this.init = (options) => {
      this.scene = options.scene;
      this.graphics = options.scene.graphics;
      this.pos = {
        x: this.scene.game.width - (this.r + 20),
        y: this.r + 20
      }
    }
    this.render = () => {
      this.graphics.lineStyle(1, 0x00ff00, 1);
      this.graphics.drawCircle(this.pos.x, this.pos.y, this.r);
    }
    this.checkHit = (pos) => {
      let xs = this.pos.x - pos.x;
      let ys = this.pos.y - pos.y;
      if(Math.hypot(xs,ys) < this.r ){
        this.scene.resetGame();
        return 'no-point';
      }
    }
  },
  Home: function () {
    this.r = 100
    this.pos = {
      x: 0,
      y: 0
    }
    this.init = (options) => {
      this.scene = options.scene;
      this.graphics = this.scene.graphics;
      this.pos = {
        x: this.scene.game.width - (this.r + 20),
        y: this.scene.game.height - (this.r + 20)
      }
      this.text = this.scene.game.add.text(this.pos.x,this.pos.y, "HOME", { font: 'bold 16pt Arial', fill: 'black', align: 'left' });
      this.text.anchor.setTo(0.5, 0.5);
    }
    this.render = () => {
      this.graphics.lineStyle(1, 0xff0000, 1);
      this.graphics.drawCircle(this.pos.x, this.pos.y, this.r);
    }
    this.checkHit = (pos) => {
      let xs = this.pos.x - pos.x;
      let ys = this.pos.y - pos.y;
      if(Math.hypot(xs,ys) < this.r / 2 ){
        this.scene.game.state.start("Home");
      }
    }
    this.destroy = () => {
      this.text.destroy();
      delete this.text;
    }
  },
  Ring: function () {
    this.r = 100
    this.stroke = 2
    this.pos = {
      x: 0,
      y: 0
    }
    this.init = (options) => {
      this.scene = options.scene;
      this.pos = options.pos;
      this.r = options.r;
      this.color = options.color;
      this.points = options.points;
      this.stroke = options.stroke;
      this.graphics = this.scene.graphics;
      this.text = this.scene.game.add.text(options.textPos.x,options.textPos.y, options.points, { font: 'bold 16pt Arial', fill: 'black', align: 'left' });
      this.text.anchor.setTo(0.5, 0.5);
    }
    this.render = () => {
      this.graphics.beginFill(this.color);
      this.graphics.lineStyle(this.stroke, 0x000000, 1);
      this.graphics.drawCircle(this.pos.x, this.pos.y, this.r);
      this.graphics.endFill();
    }
    this.checkHit = (pos) => {
      let xs = this.pos.x - pos.x;
      let ys = this.pos.y - pos.y;
      if(Math.hypot(xs,ys) < this.r /2 ){
        return this.points;
      }
    }
    this.destroy = () => {
      this.text.destroy();
    }
  },
  pointsProcess, lerp, createPoint, updatePoint, deletePoint, toScreenPos, renderPoint
}