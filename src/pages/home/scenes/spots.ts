import {pointsProcess, lerp, createPoint, updatePoint, deletePoint, toScreenPos, renderPoint} from './points-track';
import { ThrowStmt } from '@angular/compiler';

export function Pigs() {
}
Pigs.prototype = {
  preload: function () {
    this.load.image('bacon', 'assets/game_assets/sprites/Bacon.png', 150, 150);
    this.load.image('pig-die', 'assets/game_assets/sprites/Wing_Pig_Die Regular layers.png', 250, 250);
    this.game.load.spritesheet('pig', 'assets/game_assets/sprites/Pig Run Regular layers.png', 250,250, 8);

    this.load.image('pig-die-gold', 'assets/game_assets/sprites/Wing_Pig_Die Golden layers.png', 250, 250);
    this.game.load.spritesheet('pig-gold', 'assets/game_assets/sprites/Pig Run Gold layers.png', 250,250, 8);
    

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
    this.ctText = this.game.add.text(10, 100, "120 Seconds" , { font: "bold 16px Arial", fill: "#fff", align: "center" });
    this.ctText.anchor.setTo(0.5, 0);
    this.cppText = this.game.add.text(10, 100, "0" , { font: "bold 16px Arial", fill: "#fff", align: "center" });
    this.cppText.anchor.setTo(1, 0);
    // game vars

    this.currentPlayer = 0;
    this.timer = 120000;
    this.totalTimer = 120000;
    this.spawnMin = 400;
    this.spawnMax = 2000;
    this.spawnTimer = Phaser.Math.between(this.spawnMin, this.spawnMax);
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

    this.baconEmitter = this.game.add.emitter(0, 0, 400);
    this.baconEmitter.makeParticles('bacon');
    this.baconEmitter.minParticleScale = 0.4;
    this.baconEmitter.maxParticleScale = 0.4;
    this.baconEmitter.gravity = 200;
    this.baconEmitter.setAlpha(1, 0.1, 1000);

    console.log(this.baconEmitter);

    // end game vars
    this.BoardResize();
    
    let ball = new this.Pig();
    ball.init({
      scene: this
    });
    this.Objects.push(ball);
  },
  update: function () {
    // clear screen of raw visuals
    this.timer -= this.game.time.elapsed;
    this.ctText.setText(Math.floor(this.timer / 1000) + " Seconds");
    this.cppText.setText(this.players[this.currentPlayer].points);

    if(this.spawnTimer <= 0){
      this.spawnTimer = Phaser.Math.between(this.timer < 30000 ? this.spawnMin / 2 : this.spawnMin, this.timer < 30000 ? this.spawnMax / 2 :this.spawnMax);
      let ball = new this.Pig();
      ball.init({
        scene: this
      });
      this.Objects.push(ball);
    }else{
      this.spawnTimer -= this.game.time.elapsed;
    }

    if(this.game.settingsResize) {
      this.BoardResize();
      this.game.settingsResize = false;
    } 
    this.graphics.clear();

    this.graphics.lineStyle(2, 0xCCCCFF, .5);
    this.graphics.drawRect(this.playArea.pos.x, this.playArea.pos.y, this.playArea.size.x, this.playArea.size.y);
    this.graphics.lineStyle(0, 0x000000, 1);

    this.Objects.reverse().forEach((object, i)=>{
      if(object.pos){
        if(object.pos.x > this.game.width + 200 || object.pos.x < -200 || object.pos.y > this.game.height + 200 || object.pos.y < -200 || object.deleteObject){
          // if out of scene by 200 px destroy
          console.log('delete object');
          object.destroy ? object.destroy() : null;
          this.Objects.splice(i, 1);
          console.log(this.Objects);
        }
      }
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
    this.ctText.x = this.playArea.pos.x + this.playArea.size.x / 2;
    this.ctText.y = this.playArea.pos.y - 20;
    this.cppText.x = this.playArea.pos.x + this.playArea.size.x;
    this.cppText.y = this.playArea.pos.y - 20;

    let home = new this.Home();
    home.init({scene: this});
    this.Objects.push(home);
  },
  Player: function (){
    this.points = 0;
    this.init = (options) => {
      Object.keys(options).forEach((key)=>{ this[key] = options[key]; });
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
  Pig: function () {
    this.maxSpeed = 6;
    this.gold = false;
    this.goldColor = 0xFFF77A;
    this.toDie = 500;
    this.isDead = false;
    this.vect = {
      x: 0,
      y: 0
    }
    this.init = (options) => {
      Object.keys(options).forEach((key)=>{ this[key] = options[key]; });
      if(this.scene){
        this.game = this.scene.game;
        this.graphics = this.scene.graphics;
      }
      this.gold = Math.random() > (this.scene.timer < 30000 ? .9 : .95) ? true : false;
      this.maxSpeed = this.scene.playArea.size.x / 70;
      this.dir = Math.random() - .5;

      this.pos = {
        x: this.dir < 0 ? -100 : this.game.width + 100,
        y: Phaser.Math.between(this.scene.playArea.pos.y, this.scene.playArea.pos.y + this.scene.playArea.size.y)
      }

      this.sprite = this.game.add.sprite(this.pos.x, this.pos.y, (this.gold ? 'pig-gold' : 'pig'));
      this.sprite.width = this.scene.playArea.size.y / 4;
      this.sprite.height = this.scene.playArea.size.y / 4;
      this.sprite.animations.add('walk');
      this.sprite.animations.play('walk', 20, true);
      
      this.sprite.anchor.setTo(0.5);

      

      if(this.dir < 0) this.sprite.scale.x *= -1;
      let vSpeed = Phaser.Math.between(this.maxSpeed - this.maxSpeed / 4, this.maxSpeed);
      this.vect = {
        x: (this.gold ? 1.5 : 1) * (this.dir < 0 ? vSpeed : -vSpeed),
        y: Phaser.Math.between(-(this.maxSpeed / 3), this.maxSpeed / 3)
      }
    }
    this.render = () => {
      // update values
      this.pos = {
        x: this.pos.x + this.vect.x,
        y: this.pos.y + this.vect.y
      }
      this.sprite.x = this.pos.x;
      this.sprite.y = this.pos.y;
      
      if(this.isDead){
        if(this.toDie <= 0){
            this.explode();
        }else{
          this.toDie -= this.game.time.elapsed;
        }
      }

      if(this.pos.y < this.scene.playArea.pos.y || this.pos.y > this.scene.playArea.pos.y + this.scene.playArea.size.y) this.vect.y = -this.vect.y;
    }
    this.destroy = () => {
      this.sprite.destroy();
    }
    this.checkHit = (pos) => {
      console.log(this.sprite);
      if(this.sprite && this.sprite.getBounds().contains(pos.x, pos.y)){
        console.log('Hit Pig');
        this.die();
        let points = this.gold ? 100 : 50;
        this.scene.players[this.scene.currentPlayer].points += points;
      }
    }
    this.die = () => {
      this.sprite.loadTexture(this.gold ? 'pig-die-gold' : 'pig-die');
      this.sprite.anchor.setTo(0.5);
      this.vect.x *= .5;
      this.vect.y *= .5;
      this.isDead = true;
    }
    this.explode = () => {
      this.scene.baconEmitter.x = this.pos.x;
      this.scene.baconEmitter.y = this.pos.y;
      this.scene.baconEmitter.start(true, 1000, null, Phaser.Math.between(3, 7));
      this.deleteObject = true;
    }
  }
  ,
  pointsProcess, lerp, createPoint, updatePoint, deletePoint, toScreenPos, renderPoint
}