//Alexander Shieh, 2015
//Adapted from John Watson, 2014
//Licensed under the terms of the MIT License


var trainCnt = 0;
var trainFlag = 0;
var trainSeq = [];
var endFlag = 0;
var lastState = -1
var lastAction1 = 0;
var lastAction2 = 0;
var lastReward = 0;
var thisAction1 = 0;
var thisAction2  =0;
var thisReward = 0;
var thisQ = 0;
var episode = 0;
var gamma = 0.9;
var testFlag = false;
var eps = 0.;
var FPS = 3;
var Q=[];
var Qcount=[];
(function(){
  for(var i=0;i<6*20*20*36*3*3;i++){
    Q.push(0);
  Qcount.push(0);
  }
})();
//end NN

var GameState = function(game) {
};

GameState.prototype.preload = function() {
    this.game.load.spritesheet('ship', 'assets/ship.png', 32, 32);
    this.game.load.image('terrain', 'assets/terrainblock.png');
    this.game.load.image('landzone', 'assets/landzone.png');
    this.game.load.spritesheet('explosion', 'assets/explosion.png', 128, 128);
    this.stage.disableVisibilityChange = true;
};

GameState.prototype.create = function() {
    this.stage.disableVisibilityChange = true;
    this.game.stage.backgroundColor = 0x333333;
    this.PLAYED = 0;
    this.SCORE = 0;
    this.FUEL = 150;
    this.TIMER = 0;
    this.ROTATION_SPEED = 90; // degrees/second
    this.ACCELERATION = 100; // pixels/second/second
    this.MAX_SPEED = 200; // pixels/second
    this.DRAG = 0; // pixels/second
    this.GRAVITY = 50; // pixels/second/second

    //Ship
    this.ship = this.game.add.sprite(0, 0, 'ship');
    this.ship.anchor.setTo(0.5, 0.5);
    this.ship.angle = -90; // Point the ship up
    this.game.physics.enable(this.ship, Phaser.Physics.ARCADE);
    this.ship.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED); // x, y
    this.ship.body.drag.setTo(this.DRAG, this.DRAG); // x, y
    game.physics.arcade.gravity.y = this.GRAVITY;
    this.ship.body.bounce.setTo(0.25, 0.25);
    this.resetScene();

    this.explosionGroup = this.game.add.group();

    this.game.input.keyboard.addKeyCapture([
        Phaser.Keyboard.LEFT,
        Phaser.Keyboard.RIGHT,
        Phaser.Keyboard.UP,
        Phaser.Keyboard.DOWN
    ]);
};


GameState.prototype.getExplosion = function() {

    var explosion = this.explosionGroup.getFirstDead();

    if (explosion === null) {
        explosion = this.game.add.sprite(0, 0, 'explosion');
        explosion.anchor.setTo(0.5, 0.5);

        var animation = explosion.animations.add('boom', [0,1,2,3], 60, false);
        animation.killOnComplete = true;

        this.explosionGroup.add(explosion);
    }

    explosion.revive();

    explosion.x = this.ship.x;
    explosion.y = this.ship.y;

    explosion.angle = this.game.rnd.integerInRange(0, 360);

    explosion.animations.play('boom');

    return explosion;
};

GameState.prototype.getReward = function(){
    var h, v, ax, ay;
    //h = Math.max(this.ship.x, this.game.width - this.ship.x);
    //v = Math.max(this.ship.y, this.game.height - this.ship.y);
    /*
    h = 400-Math.abs(this.ship.x-400);
    v = 400-Math.abs(this.ship.y-400);
    ax = this.ship.body.acceleration.x;
    ay = this.ship.body.acceleration.y;
    return (h +v - 100*Math.sin(this.ship.rotation))/1000;*/
    return FPS;
    //return Math.log(1/Math.abs(Math.max(h, v))) + -10*(Math.sin(this.ship.rotation)+0.5);
};

GameState.prototype.getState = function(){
    //var state = new convnetjs.Vol(1, 1, 12, 0.0);
    w0 = Math.min(19, Math.max(0, (this.ship.body.velocity.x+100)/10))|0;
    w1 = Math.min(19, Math.max(0, (this.ship.body.velocity.y+100)/10))|0;
    w5 = this.ship.rotation%360;
    if(w5 <0) w5+=360;
    w5 = Math.min(35, Math.max(0, w5/36))|0;
    w6 = Math.min(2, Math.max(0, this.ship.x/266))|0;
    w7 = Math.min(2, Math.max(0, this.ship.y/266))|0;
    return 6*(w7+3*(w6+3*(w5+36*(w1+20*w0))));
};

GameState.prototype.updateScore = function(flag) {
    this.PLAYED++;
    this.SCORE=0.1*this.TIMER+0.9*this.SCORE;
    document.getElementById("score").innerHTML = (this.SCORE|0)+'/'+this.PLAYED+'/'+eps.toFixed(4);
    document.getElementById("episode").innerHTML = ++episode;
};

GameState.prototype.showVelocity = function() {
    document.getElementById("vx").innerHTML = this.ship.body.velocity.x.toFixed(2);
    document.getElementById("vy").innerHTML = this.ship.body.velocity.y.toFixed(2);
    document.getElementById("fuel").innerHTML = this.FUEL;
    document.getElementById("reward").innerHTML = lastReward.toFixed(2);
    document.getElementById("action").innerHTML = thisAction1 +" "+ (thisAction2+1)
    var color = 'blue';
    if(thisQ==0)
      color = 'red';
    else if(thisQ > 300)
      color = 'green';
        document.getElementById("action").innerHTML +=" <span style='color: "+color+"'>"+("0000"+(thisQ|0)).slice(-4)+"</span>";
    document.getElementById("timer").innerHTML = this.TIMER;
    
};

GameState.prototype.resetScene = function() {
    // Move the ship back to the top of the stage
    
    if(testFlag){
    this.ship.x = 300 + Math.random()*200;
    this.ship.y = 300 + Math.random()*200;
    this.ship.body.acceleration.setTo(0, 0);
    this.ship.angle = this.game.rnd.integerInRange(-80, -100);    
    this.ship.body.velocity.setTo(Math.random()*10 - 5, Math.random()*10 - 5);
    }
    else {
    this.ship.x = 50+Math.random()*700;
    this.ship.y = 50+Math.random()*700;
    this.ship.body.acceleration.setTo(0, 0);
    this.ship.angle = this.game.rnd.integerInRange(-10, -170);    
    this.ship.body.velocity.setTo(Math.random()*100 - 50, Math.random()*100 - 50);        
    }
    
    this.FUEL = 1000;
    this.TIMER = 0;
    lastState = this.getState(0, 0);
};

// The update() method is called every frame
GameState.prototype.update = function() {
    
    //Upd
    this.TIMER++;
    if(this.TIMER % FPS == 0){
        thisReward = this.getReward();
    }
    this.showVelocity(this.ship.body.velocity.x, this.ship.body.velocity.y);
    

    //Game Over
    if(this.ship.x > this.game.width || this.ship.x < 0 || this.ship.y > this.game.height || this.ship.y < 0){
        endFlag = 1;
        this.updateScore(endFlag);
	thisReward = -100;
    }else if(this.FUEL <= 0){
        endFlag = 2;
        this.updateScore(endFlag);
    }


    //Rotation
    if(thisAction2 == -1) {
        this.ship.body.angularVelocity = -this.ROTATION_SPEED;
    }else if(thisAction2 == 1) {
        this.ship.body.angularVelocity = this.ROTATION_SPEED;
    }else{
        this.ship.body.angularVelocity = 0;
    }

    if(thisAction1 == 1 ) {
        this.ship.body.acceleration.x = Math.cos(this.ship.rotation) * this.ACCELERATION;
        this.ship.body.acceleration.y = Math.sin(this.ship.rotation) * this.ACCELERATION;
        this.FUEL -= 1;
        this.ship.frame = 1;
    }else{
        this.ship.body.acceleration.setTo(0, 0);
        this.ship.frame = 0;
    }
    

    if(this.TIMER % FPS == 0){
      thisState = this.getState();
        if(Math.random() > eps){
            thisAction1 = Math.floor(Math.random()*2);	  
	    thisAction2 = Math.floor(Math.random()*3)-1; 
        }else{
                    var max = -1e9;
		    for(var a1=0;a1<2;a1++)
		      for(var a2=-1;a2<2;a2++)
		      {
			var approx = Q[thisState+a1*3+a2+1];                    
                if(approx >= max){
                    thisAction1 = a1;
		    thisAction2 = a2;
                    max = approx;		    
                }
            }
        }
        
        thisQ = Q[thisState+thisAction1*3+thisAction2+1];
        if(endFlag) thisState = -1;
        trainSeq.push([lastState, lastAction1, lastAction2, thisReward, thisState]);
        lastState = thisState;
        lastAction1 = thisAction1;
	lastAction2 = thisAction2;
        lastReward = thisReward;
    }
    
    if(endFlag){
      if(eps < 0.9)
      eps+=0.0001      
      var S=0.0;
      var R=-1000.0;
       if(endFlag ==2) R = 0;
       R=0;
        while(trainSeq.length){
            var data = trainSeq.pop();
            var X = data[0]+data[1]*3+data[2]+1;
            var Y = Q[X];
	    var Z = data[4];
            var Reward = data[3];
	    //R = data[3]+0.9*R;
	    /*R = R+FPS;
	    if(endFlag==1 || Y<R)
	      Q[X]=Y+0.1*(R-Y)
	      */
	   /*
	    S=1+0.9*S;
	    R=data[3]+0.9*R;
	    Q[X]=Q[X]+0.1*(R-Q[X]);
	    */
	    // Q learning
	    var max=0;
            if(Z != -1)
	    for(var a=0;a<6;a++){
	      if(Q[Z+a]>max)
		max = Q[Z+a];
	    }	    

	    
	   if(endFlag==1 || Y < Reward+max){
	      Q[X] = Y+(Reward+max-Y)/(Qcount[X]+1);
	      if(Qcount[X] <10)  Qcount[X] +=1;
	   }
	    
        }
    }
    if(endFlag){
        lastReward = 0;
        thisReward = 0;
        endFlag = 0;
        this.resetScene(); 
    }

};

GameState.prototype.leftInputIsActive = function() {
    var isActive = false;

    isActive = this.input.keyboard.isDown(Phaser.Keyboard.LEFT);
    // isActive |= (this.game.input.activePointer.isDown &&
    //     this.game.input.activePointer.x < this.game.width/4);

    return isActive;
};

GameState.prototype.rightInputIsActive = function() {
    var isActive = false;

    isActive = this.input.keyboard.isDown(Phaser.Keyboard.RIGHT);
    // isActive |= (this.game.input.activePointer.isDown &&
    //     this.game.input.activePointer.x > this.game.width/2 + this.game.width/4);

    return isActive;
};

GameState.prototype.upInputIsActive = function() {
    var isActive = false;

    isActive = this.input.keyboard.isDown(Phaser.Keyboard.UP);
    // isActive |= (this.game.input.activePointer.isDown &&
    //     this.game.input.activePointer.x > this.game.width/4 &&
    //     this.game.input.activePointer.x < this.game.width/2 + this.game.width/4);

    return isActive;
};

var game = new Phaser.Game(800, 800, Phaser.AUTO, 'game');
game.state.add('game', GameState, true);