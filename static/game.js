
var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
                       window.mozRequestAnimationFrame || window.msRequestAnimationFrame || 
                       function(c) {window.setTimeout(c, 15)};

window.addEventListener('load', onloadHandler, false);
window.addEventListener('beforeunload', onunloadHandler, false);



var bitmaps = [];   
var my_id = -1;
var players = {}
var socket = io.connect('http://' + document.domain + ':' + location.port + '/maze');

function onloadHandler()
{
   // get the images loading
   var loader = new Phoria.Preloader();
   for (var i=0; i<6; i++)
   {
      bitmaps.push(new Image());
      loader.addImage(bitmaps[i], 'static/images/texture'+i+'.png');
   }
   loader.onLoadCallback(init);
}

function onunloadHandler()
{
	console.log('leaving');
	socket.emit('removePlayer', {'id': my_id});
}

function init()
{
	document.addEventListener('pointerlockchange', lockChangeAlert, false);
	document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
	document.addEventListener('webkitpointerlockchange', lockChangeAlert, false);


	var canvas = document.getElementById('canvas');
	//var posbox = document.getElementById('posbox');
	canvas.requestPointerLock = canvas.requestPointerLock ||
		canvas.mozRequestPointerLock ||
		canvas.webkitRequestPointerLock;

	document.exitPointerLock = document.exitPointerLock ||
			 document.mozExitPointerLock ||
			 document.webkitExitPointerLock;
	canvas.onclick = function() {
		canvas.requestPointerLock();
	}
	function lockChangeAlert() {
	if(document.pointerLockElement === canvas ||
		document.mozPointerLockElement === canvas ||
		document.webkitPointerLockElement === canvas) {
		//console.log('The pointer lock status is now locked');
		document.addEventListener("mousemove", turnMouse, false);
	}else{
		//console.log('The pointer lock status is now unlocked');  
		document.removeEventListener("mousemove", turnMouse, false);
	  }
	}

   // get the canvas DOM element and the 2D drawing context
   // create the scene and setup camera, perspective and viewport
   var acol = true; //activate collision 
   var scene = new Phoria.Scene();
   scene.camera.position = {x:0.0, y:5.0, z:-15.0};
   console.log(scene.perspective.fov, scene.perspective.near)
   //scene.perspective.fov = 75;
   scene.perspective.near = 1;
   //scene.perspective.far = 1000;
   scene.perspective.aspect = canvas.width / canvas.height;
   scene.viewport.width = canvas.width;
   scene.viewport.height = canvas.height;
      /**
    * @param forward {vec3}   Forward movement offset
    * @param heading {float}  Heading in Phoria.RADIANS
    * @param lookAt {vec3}    Lookat projection offset from updated position
    */
	var sp = 10;
	var fnPositionLookAt = function positionLookAt(forward, heading, lookAt) {
		// recalculate camera position based on heading and forward offset
		var pos = vec3.fromValues(
			 scene.camera.position.x,
			 scene.camera.position.y,
			 scene.camera.position.z);
		var opos = vec3.fromValues(
			 scene.camera.position.x,
			 scene.camera.position.y,
			 scene.camera.position.z);
		  var ca = Math.cos(heading), sa = Math.sin(heading);
		  var rx = forward[0]*ca - forward[2]*sa,
			  rz = forward[0]*sa + forward[2]*ca;
		  forward[0] = sp*rx;
		  forward[2] = sp*rz;
		  forward[1] = sp*forward[1];
		  vec3.add(pos, pos, forward);
		  if(!acol || !collide(pos)){
			  scene.camera.position.x = pos[0];
			  scene.camera.position.y = pos[1];
			  scene.camera.position.z = pos[2];
			  //console.log('cam pos', pos);
			  // calcuate rotation based on heading - apply to lookAt offset vector
			  rx = lookAt[0]*ca - lookAt[2]*sa,
			  rz = lookAt[0]*sa + lookAt[2]*ca;
			  vec3.add(pos, pos, vec3.fromValues(rx, lookAt[1], rz));
			  // set new camera look at
			  scene.camera.lookat.x = pos[0];
			  scene.camera.lookat.y = pos[1];
			  scene.camera.lookat.z = pos[2];
			  //console.log('lookat ',[pos[0], pos[1], pos[2]]);
			  return pos;
		  }
		  return opos;
	}

	var renderer = new Phoria.CanvasRenderer(canvas);
   
   	// add a grid to help visualise camera position etc.
	var plane = Phoria.Util.generateTesselatedPlane(20,20,0,100);
	var planeObj = Phoria.Entity.create({
		  points: plane.points,
		  edges: plane.edges,
		  polygons: plane.polygons,
		  style: {
			 drawmode: "wireframe",
			 shademode: "plain",
			 linewidth: 0.5,
			 objectsortmode: "back"
		  }
	})
	scene.graph.push(planeObj);
	/*var blueLightObj = Phoria.Entity.create({
		  points: [{x:0, y:0, z:0}],
		  style: {
			 color: [0,255,255],
			 drawmode: "point",
			 shademode: "plain",
			 linewidth: 5,
			 linescale: 2,
			}
	});
	scene.graph.push(blueLightObj);
	var blueLight = Phoria.PointLight.create({
		position: {x:0, y:2, z:0},
		color: [0,0,1]
	});
	blueLightObj.children.push(blueLight);
	scene.graph.push(Phoria.DistantLight.create({
      direction: {x:0, y:5, z:0}
	}));
	*/
	var visibleLightObj = Phoria.Entity.create({
      points: [{x:0, y:0, z:0}],
      style: {
         color: [255,0,0],
         drawmode: "point",
         shademode: "plain",
         linewidth: 5,
         linescale: 2
      }
   });
   scene.graph.push(visibleLightObj);
	

	var mzsz = -1;
	var mzst = -1;
	var mzed = -1;
	var mzcoor = [];
	var mzsc = 2*50;
	var mzcube = {};


	var draw_cube = function(ky){ //draws other players
		cube = players[ky]['cube'];
		//cube.identity().rotateZ(3.14/2);//players[key]['heading']*Phoria.RADIANS);
		cube.identity().translate(vec3.fromValues(players[ky]['pos'][0], players[ky]['pos'][1]-mzsc/4, players[ky]['pos'][2]));
		cube.scaleN(mzsc/4);
	}
	
	var mzCoor = function(ind){ //turns maze index into 3d coordinates
		var mps = [(ind-ind%mzsz)/mzsz, ind%mzsz];
		var sf = mzsc*mzsz/2;
		return [mps[0]*mzsc-sf, 0, mps[1]*mzsc-sf];
	}
	
	var collide = function(ps){ //check for your collision with maze
		//console.log('cl', ps, mzcoor.length);
		for(var i = 0; i < mzcoor.length; i++){
			ind = mzcoor[i];
			var mpl = mzCoor(ind);
			var tsz = mzsc+15;
			//console.log('x',mpl[0]-tsz, ps[0],mpl[0]+tsz);
			//console.log('y',mpl[1]-tsz, ps[1],mpl[1]+tsz);
			//console.log('z',mpl[2]-tsz, ps[2],mpl[2]+tsz);
			
			if(ps[0]>mpl[0]-tsz && ps[0]<mpl[0]+tsz &&
				ps[1]>mpl[1]-tsz && ps[1]<mpl[1]+tsz &&
				ps[2]>mpl[2]-tsz && ps[2]<mpl[2]+tsz){
					//console.log('COLLIDED');
					return true;
				}
		}
		return false;
	}
	
	var collideed = function(ps){ //check for your collision with maze
		ind = mzed;
		var mpl = mzCoor(ind);
		var tsz = mzsc;
		if(ps[0]>mpl[0]-tsz && ps[0]<mpl[0]+tsz &&
			ps[1]>mpl[1]-tsz && ps[1]<mpl[1]+tsz &&
			ps[2]>mpl[2]-tsz && ps[2]<mpl[2]+tsz){
				//console.log('COLLIDED');
				return true;
		}
		return false;
	}
	
	//my info
	var heading = 0.0;
   	var lookAt = vec3.fromValues(0,-10,15);
	var my_pos = [scene.camera.position.x, scene.camera.position.y, scene.camera.position.z];
	//console.log('inital position', my_pos);

	var re_draw = function(){ //draw loop
		//console.log('draw ', Object.keys(players).length);
		for (var ky in players){
			draw_cube(ky);
		}
	}
	//var create 
	var create_player = function(ky) //initializes other players drawing object
	{
		var c = Phoria.Util.generateUnitCube();
		var cube = Phoria.Entity.create({
			points: c.points,
			edges: c.edges,
			polygons: c.polygons
		});
		for (var i=0; i<6; i++)
		{
			cube.textures.push(bitmaps[i]);
			cube.polygons[i].texture = i;
		}
		scene.graph.push(cube);
		players[ky]['graph_id'] = scene.graph.length-1;
		players[ky]['cube'] = cube;
	}

	console.log('connecting');
	console.log('sending pos to server', my_pos);
	socket.emit('addPlayer', {'pos': [my_pos[0], my_pos[1], my_pos[2]], 'heading': heading});
	socket.on('set_id', function(msg) { //sets your id
		my_id = msg['id'];
		console.log('MY ID IS', my_id);
		socket.emit('getMazeCoor', {'id': my_id, 'pos': [my_pos[0], my_pos[1], my_pos[2]]});
	});
	socket.on('set_players', function(msg) { //sets other existing players when you join
		console.log('setting prev player', Object.keys(msg).length);
		for(var ky in msg){
			players[ky] = msg[ky];
			create_player(ky);
		}
		});
	socket.on('playerLeft', function(pinfo) { //removes player who left
		var ky = pinfo['key'];
		if (pinfo['data']['id'] != my_id){
			var graph_id = players[ky]['graph_id'];
			scene.graph.splice(graph_id,1);
			delete players[ky];
			console.log('player left');
		}
	});
	socket.on('playerAdded', function(pinfo) { //ad newly joined player
		var ky = pinfo['key'];
		if (pinfo['data']['id'] != my_id){
			console.log('player added');
			players[ky] = pinfo['data'];
			create_player(ky);
		}
	});
	socket.on('playerMoved', function(pinfo) { //move other player
		var ky = pinfo['key'];
		if (pinfo['data']['id'] != my_id){
			players[ky]['pos'] = pinfo['data']['pos'];
			//console.log('player moved', players[ky]['pos']);
		}
	});
	socket.on('playerTurned', function(pinfo) { //doesnt do anything for now
		var ky = pinfo['key'];
		if (pinfo['data']['id'] != my_id){
			players[ky]['heading'] = pinfo['data']['heading'];
			//console.log('player turned', players[ky]['heading']);
		}
	});
	Array.prototype.diff = function(a) {
   		return (this.filter(function(i) {return a.indexOf(i) < 0;}));
	};
	socket.on('mazeUpdate', function(pinfo){ //initalize maze coordinates
		//console.log('updating maze');
		var prmzcoor = mzcoor;
		//console.log('old', prmzcoor);
		mzcoor = pinfo['data']['coor'];
		mzst = pinfo['data']['st'];
		mzed = pinfo['data']['ed'];
		mzsz = pinfo['data']['sz'];
		
		//set up start and finish
		var st = mzCoor(mzst);
		var ed = mzCoor(mzed);
		scene.camera.position = {x:st[0], y:st[1], z:st[2]};
		//console.log('ed', ed);
		var c = Phoria.Util.generateUnitCube();
		var edcube = Phoria.Entity.create({
			id: "Cube End",
			points: c.points,
			edges: c.edges,
			polygons: c.polygons,
			style: {
				color: [255, 0, 0]
			}
		});
		edcube.translate(vec3.fromValues(ed[0], ed[1], ed[2]));
		edcube.scaleN(mzsc/4);
		//console.log(edcube, pl);
		scene.graph.push(edcube);
		
		var sub1 = prmzcoor.diff(mzcoor);
		for(var i=0; i<sub1.length;i++){
			//scene.graph.pull(mzcube[sub1[i]]);
		}
		var sub2 = mzcoor.diff(prmzcoor); //maze pts to add
		//console.log('to add', sub2);
		for(var i=0; i < sub2.length; i++){
			var ind = sub2[i]; //index of maze pt in mzcoor
			//console.log('tot', Object.keys(mzcube).indexOf(ind), ind);
			if((Object.keys(mzcube)).indexOf(ind) == -1){//to check if maze pt is already there
				//mzcoor.appned(ind);
				pl = mzCoor(ind);
				var c = Phoria.Util.generateUnitCube();
				var cube = Phoria.Entity.create({
					id: "Cube Blue",
					points: c.points,
					edges: c.edges,
					polygons: c.polygons,
					style: {
						color: [Math.random()*155+100,Math.random()*155+100,Math.random()*155+100]
					}
				});
				/*for (var i=0; i<6; i++)
				{
					cube.textures.push(bitmaps[i]);
					cube.polygons[i].texture = i;
				}*/
				//cube.rotateY(0.5*Phoria.RADIANS);
				cube.translate(vec3.fromValues(pl[0], pl[1], pl[2]));
				cube.scaleN(mzsc/2);
				mzcube[ind] = cube;
			}
			scene.graph.push(mzcube[ind]);
			/*var blueLight = Phoria.PointLight.create({
				position: {x:pl[0], y:pl[1]+mzsc*2, z:pl[2]},
				color: [0,0,1]
			});
			blueLightObj.children.push(blueLight);
			*/
			var light = Phoria.PointLight.create({
			  color: [Math.random(), Math.random(), Math.random()],
			  position: {x:pl[0], y:pl[1]+mzsc, z:pl[2]},
			  intensity: 1,
			  attenuation: 0
		   });
		   visibleLightObj.children.push(light);
		}
		//console.log(mzcube)
	});
	
	var incTrip = function(t){ //handles "trippyness" of maze
		var ntrip = Math.floor(100/(1+Math.pow(Math.E, -(0.0005)*(t/25))));
		//console.log('ntrip', ntrip, t);
		scene.perspective.fov = ntrip;
	}
	
	var pause = false;
	var d = new Date();
	var stTime = d.getTime();
	var time = 0;
	var fnAnimate = function() { //game loop
		if (!pause)
		{
			//posbox.innerHTML = "x: " + scene.camera.position.x + " y: " + scene.camera.position.y + " z: " + scene.camera.position.z;
			//time = (new Date()).getTime()-stTime;
			//console.log(time);
			//incTrip(time);
			//console.log('animate');
			//blueLightObj.identity().translate(vec3.fromValues(my_pos[0], my_pos[1], my_pos[2]));
			re_draw();
			scene.modelView();
			renderer.render(scene);
			if(collideed(my_pos)){
				pause = true;
				console.log('WIN');
				window.alert("YOU REACHED FINISH!!!!");
			}
		}
		requestAnimFrame(fnAnimate);
	};
	
	var moveSteps = function(nps){ //handles your move after input
		//console.log(collide(nps));
		my_pos = nps;
		//console.log(my_pos);
		//socket.emit('getMazeCoor', {'id': my_id, 'pos': [my_pos[0], my_pos[1], my_pos[2]]});
		socket.emit('playerMoved', {'id': my_id, 'pos': [my_pos[0], my_pos[1], my_pos[2]]});
	}

	document.addEventListener('keydown', function(e) {
		//console.log(e.keyCode);
		switch (e.keyCode)
		{
			case 27: // ESC
				pause = !pause;
				break;
			case 87: // W
				// move forward along current heading
				moveSteps(fnPositionLookAt(vec3.fromValues(0,0,1), heading, lookAt));
				break;
			case 83: // S
				// move back along current heading
				moveSteps(fnPositionLookAt(vec3.fromValues(0,0,-1), heading, lookAt));
				break;
			case 65: // A
				// strafe left from current heading
				moveSteps(fnPositionLookAt(vec3.fromValues(-1,0,0), heading, lookAt));
				break;
			case 68: // D
				// strafe right from current heading
				moveSteps(fnPositionLookAt(vec3.fromValues(1,0,0), heading, lookAt));
				break;
			case 84: // T
				// move forward along current heading
				moveSteps(fnPositionLookAt(vec3.fromValues(0,1,0), heading, lookAt));
				break;
			case 71: // G
				// move back along current heading
				moveSteps(fnPositionLookAt(vec3.fromValues(0,-1,0), heading, lookAt));
				break;
			case 37: // LEFT
				// turn left
				heading += Phoria.RADIANS*4;
				// recalculate lookAt
				// given current camera position, project a lookAt vector along current heading for N units
				fnPositionLookAt(vec3.fromValues(0,0,0), heading, lookAt);
				socket.emit('playerTurned', {'id': my_id, 'heading': heading});
				break;
			case 39: // RIGHT
				// turn right
				heading -= Phoria.RADIANS*4;
				// recalculate lookAt
				// given current camera position, project a lookAt vector along current heading for N units
				fnPositionLookAt(vec3.fromValues(0,0,0), heading, lookAt);
				socket.emit('playerTurned', {'id': my_id, 'heading': heading});
				break;
			case 38: // UP
				lookAt[1]++;
				fnPositionLookAt(vec3.fromValues(0,0,0), heading, lookAt);
				socket.emit('playerTurned', {'id': my_id, 'heading': heading});
				break;
			case 40: // DOWN
				lookAt[1]--;
				fnPositionLookAt(vec3.fromValues(0,0,0), heading, lookAt);
				socket.emit('playerTurned', {'id': my_id, 'heading': heading});
				break;
			case 67:
				acol = !acol;
		}
	}, false);
	var pmx = -1;
	var pmy = -1;
	var mx = 0;
	var my = 0;
	function turnMouse(e) { //handles turning
		pmx = mx;
		pmy = my;
		mx += e.movementX ||e.mozMovementX||e.webkitMovementX||0;
		my += e.movementY ||e.mozMovementY||e.webkitMovementY||0;
		//console.log(mx,my);
		heading -= (mx-pmx)/1000.0;
		lookAt[1]-=(my-pmy)/1000.0*180/3.14;
		fnPositionLookAt(vec3.fromValues(0,0,0), heading, lookAt);
	}
		
   requestAnimFrame(fnAnimate);
}
