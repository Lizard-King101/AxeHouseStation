import { Injectable } from '@angular/core';
declare var io;

@Injectable()
export class SocketIO{
    public io;
    public io2;
    constructor(){
        this.io = io('http://localhost:3000');
        this.io2 = io('http://localhost:3030');
    }
}