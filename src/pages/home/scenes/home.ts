import {pointsProcess, lerp, createPoint, updatePoint, deletePoint, toScreenPos, renderPoint} from './points-track';

export function Home() {
}
Home.prototype = {
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

    // game vars

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

    this.graphics.beginFill('0xCC00FF');
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
    }
  },
  resize: function(){
    this.BoardResize();
  },
  BoardResize: function (){
    this.Objects.forEach((object)=>{object.destroy ? object.destroy() : null});
    this.Objects = [];
    let width = this.game.width > this.game.height;
    this.playArea.size = {
      x: (width ? this.game.height * (this.game.boardSize / 100) : this.game.width * (this.game.boardSize / 100)) + this.game.boardSizeAdjust.x ,
      y: (width ? this.game.height * (this.game.boardSize / 100) : this.game.width * (this.game.boardSize / 100)) + this.game.boardSizeAdjust.y 
    }
    this.playArea.pos = {
      x: (this.game.width / 2 - this.playArea.size.x / 2) + this.game.boardPositionAdjust.x,
      y: (this.game.height / 2 - this.playArea.size.y / 2) + this.game.boardPositionAdjust.y
    }
  },
  pointsProcess, lerp, createPoint, updatePoint, deletePoint, toScreenPos, renderPoint
}