export function pointsProcess () {
    let pointKeys = this.points ? Object.keys(this.points) : [];

    if(this.game.frameData && Object.keys(this.game.frameData.points).length > 0){
        let newPoints = this.game.frameData.points;
        let newKeys = Object.keys(this.game.frameData.points);
        newKeys.forEach((k)=>{
        if(pointKeys.indexOf(k) > -1){
            this.updatePoint(k, this.toScreenPos(newPoints[k].center));
        }else{
            this.createPoint(k, this.toScreenPos(newPoints[k].center));
        }
        });
        pointKeys.forEach((k)=>{
        if(!this.points[k].updated && k != 'cursor'){
            this.deletePoint(k);
        }else{
            this.points[k].updated = false;
        }
        })
    }else if(pointKeys.length > 0){
        pointKeys.forEach((k)=>{if(k != 'cursor') this.deletePoint(k); });
    }
    if(pointKeys.length > 0){
        pointKeys.forEach((k)=>{this.renderPoint(k);});
    }

  }
export function toScreenPos (pos) {
    let width = this.game.width > this.game.height;
    let c = this.game.frameData.size;
    let newPos = {
        x: !width ? (pos.x * (this.game.height * c.x / c.y) / c.x) - (((this.game.height * c.x / c.y) - this.game.width) / 2) : pos.x * this.game.width / c.x,
        y: width ? (pos.y * (this.game.width * c.y / c.x) / c.y) - (((this.game.width * c.y / c.x) - this.game.height) / 2) : pos.y * this.game.height / c.y
    };
    return newPos;
}
export function createPoint (key, pos) {
    let name = this.game.add.text(pos.x, pos.y - 10, key, { font: 'bold 10pt Arial', fill: 'white', align: 'left' });
    name.anchor.setTo(0.5, 1);
    this.points[key] = { pos, name, counto: this.game.pointToHit, countat: 0, lerped: 0, tracking: true };
}
export function deletePoint(key) {
    this.points[key].name.destroy();
    delete this.points[key];
}
export function updatePoint(key, pos) {
    let point = this.points[key];
    point.lastPos = point.pos;
    if(key == 'cursor'){
        point.pos = pos;
    }else{
        point.pos = {
        x: this.lerp(point.lastPos.x, pos.x, .5),
        y: this.lerp(point.lastPos.y, pos.y, .5)
        };
    }
    point.updated = true;
}
export function renderPoint(key) {
    if(this.points[key]){
      let point = this.points[key];
      if(!point.lastPos) point.lastPos = point.pos;
      let pos = point.pos;
      let r = 10;
      let dist = this.game.pointSensitivity;
      this.graphics.lineStyle(0);
      this.graphics.beginFill(0xFFFF0B);
      this.graphics.drawCircle(pos.x,pos.y,r);
      this.graphics.endFill();
      let xs = point.lastPos.x - pos.x;
      let ys = point.lastPos.y - pos.y;


      if(Math.hypot(xs,ys) < dist ){
        if(point.tracking){
          if(point.countat <= point.counto){
            point.countat += this.game.time.elapsed;
          }else if(!point.hitOnce){
                point.hitOnce = true;
                let val = false;
                let nopoint = false;
                this.Objects.forEach((object)=>{
                    if(object.checkHit) {
                        let point = object.checkHit(pos);
                        console.log('click return', point);
                        if(point == 'no-point') nopoint = true;
                        else if(point) val = point > val ? point : val;
                    }
                })
                if(this.givePoints && !nopoint) this.givePoints(val);
            }
            point.lerped = this.lerp(point.lerped, point.countat, 0.5);
            this.graphics.lineStyle(5, 0x000000, 1);
            this.graphics.arc(pos.x, pos.y, 10, 0, point.lerped * (Math.PI * 2) / point.counto, false);
            }else{
                
                point.tracking = true;
                point.countat = 0;
                point.lerped = 0;
            }
        }else{
            point.hitOnce = false;  
            point.tracking = false;
            point.countat = 0;
            point.lerped = 0;
        }

      point.name.x = pos.x;
      point.name.y = pos.y - r / 2;
    }
}
export function lerp(start,end,amt){
    return (1-amt)*start+amt*end;
}