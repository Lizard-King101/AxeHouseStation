import { Component, ViewChild } from '@angular/core';
import { NavController, Events, ToastController, ToastOptions } from 'ionic-angular';
import { CameraController } from '../../app/services/camera.provider';

import "pixi";
import "p2";
import * as Phaser from 'phaser-ce';
import { ElectronProvider } from '../../app/services/electron/electron';

import { Home } from './scenes/home';
import { Planks } from './scenes/planks';
import { Pigs } from './scenes/spots';
import { Target } from './scenes/target';
import { SocketIO } from '../../app/services/socket.provider';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild('container') container: any;
  config = {
    width: '100%',
    height: '100%',
    renderer: Phaser.CANVAS,
    antialias: true,
    parent: 'game-container'
  };
  game;
  resizeKeys = ['plankCount', 'boardSize', 'boardSizeAdjust'];
  scenes = [];
  players = [];
  station = "";
  io;
  ingame = false;

  constructor(
    public navCtrl: NavController,
    private camera: CameraController, 
    private events: Events, 
    private electron: ElectronProvider,
    private socket: SocketIO,
    private toast: ToastController
  ) {
    this.io = socket.io2;
    this.scenes.push({function: Home, name: "Home"});

    this.scenes.push({function: Planks, name: "Planks"});
    this.scenes.push({function: Pigs, name: "Pigs"});
    this.scenes.push({function: Target, name: "Target"});

    this.events.subscribe('game:settings', (settings:any)=>{
      this.game.settingsResize = true;
      Object.keys(settings).forEach((key)=>{this.game[key] = settings[key]});
    });
  }

  ionViewWillEnter() {
    this.game = new Phaser.Game(this.config);
    this.electron.localGet('game-settings.json').then((data)=>{
      if(data !== null) Object.keys(data).forEach((key)=>{this.game[key] = data[key]});
      this.game.scenes = [];
      this.scenes.forEach((scene, i)=>{
        this.game.state.add(scene.name, scene.function, (i == 0 ? true : false));
      });
      this.game.io = this.socket.io2;
      this.game.users = [];
    });
    console.log(this.game);
    this.camera.on('frame', (data)=>{
      this.game.frameData = data;
    });
    this.camera.Init();
    this.io.on('station-joined', (data)=>{
      this.station = data;
    });
    this.io.on('server-reset', () => {
      console.log('get new id');
      this.players = [];
      this.io.emit('station-join');
    });
    this.io.on('user-update', (data)=>{
      if (data.action === 'join') {
        this.players.push(data.id);
        this.toast.create({message: `User ${data.id} has joined the station`, duration: 1000} as ToastOptions).present();
      }
      if (data.action === 'leave') {
        this.players.splice(this.players.indexOf(data.id), 1);
        this.toast.create({message: `User ${data.id} has left the station`, duration: 1000} as ToastOptions).present();
      }
    });

    

    this.io.emit('station-join');
  }

}