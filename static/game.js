
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
   // get the canvas DOM element and the 2D drawing context
   var canvas = document.getElementById('canvas');
   // create the scene and setup camera, perspective and viewport
   var acol = true; //activate collision 
   var scene = new Phoria.Scene();
   scene.camera.position = {x:0.0, y:5.0, z:-15.0};
   console.log(scene.perspective.fov, scene.perspective.near)
   scene.perspective.fov = 75;
   scene.perspective.near = 5;
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
         color: [0,0,255],
         drawmode: "point",
         shademode: "plain",
         linewidth: 5,
         linescale: 2
      }
   });
   scene.graph.push(visibleLightObj);
	

	var mzsz = -1;
	var mzcoor = [];
	var mzsc = 2*50;
	var mzcube = {};


	var draw_cube = function(ky){
		cube = players[ky]['cube'];
		//cube.identity().rotateZ(3.14/2);//players[key]['heading']*Phoria.RADIANS);
		cube.identity().translate(vec3.fromValues(players[ky]['pos'][0], players[ky]['pos'][1], players[ky]['pos'][2]));
	}
	
	var mzCoor = function(ind){
		var mps = [(ind-ind%mzsz)/mzsz, ind%mzsz];
		var sf = mzsc*mzsz/2;
		return [mps[0]*mzsc-sf, 0, mps[1]*mzsc-sf];
	}
	
	var collide = function(ps){
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
					console.log('COLLIDED');
					return true;
				}
		}
		return false;
	}
	
	//my info
	var heading = 0.0;
   	var lookAt = vec3.fromValues(0,-10,15);
	var my_pos = [scene.camera.position.x, scene.camera.position.y, scene.camera.position.z];
	//console.log('inital position', my_pos);

	var re_draw = function(){
		//console.log('draw ', Object.keys(players).length);
		for (var ky in players){
			draw_cube(ky);
		}
	}
	//var create 
	var create_player = function(ky)
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
	socket.on('set_id', function(msg) {
		my_id = msg['id'];
		console.log('MY ID IS', my_id);
		socket.emit('getMazeCoor', {'id': my_id, 'pos': [my_pos[0], my_pos[1], my_pos[2]]});
	});
	socket.on('set_players', function(msg) {
		console.log('setting prev player', Object.keys(msg).length);
		for(var ky in msg){
			players[ky] = msg[ky];
			create_player(ky);
		}
		});
	socket.on('playerLeft', function(pinfo) {
		var ky = pinfo['key'];
		if (pinfo['data']['id'] != my_id){
			var graph_id = players[ky]['graph_id'];
			scene.graph.splice(graph_id,1);
			delete players[ky];
			console.log('player left');
		}
	});
	socket.on('playerAdded', function(pinfo) {
		var ky = pinfo['key'];
		if (pinfo['data']['id'] != my_id){
			console.log('player added');
			players[ky] = pinfo['data'];
			create_player(ky);
		}
	});
	socket.on('playerMoved', function(pinfo) {
		var ky = pinfo['key'];
		if (pinfo['data']['id'] != my_id){
			players[ky]['pos'] = pinfo['data']['pos'];
			console.log('player moved', players[ky]['pos']);
		}
	});
	socket.on('playerTurned', function(pinfo) {
		var ky = pinfo['key'];
		if (pinfo['data']['id'] != my_id){
			players[ky]['heading'] = pinfo['data']['heading'];
			console.log('player turned', players[ky]['heading']);
		}
	});
	Array.prototype.diff = function(a) {
   		return (this.filter(function(i) {return a.indexOf(i) < 0;}));
	};
	socket.on('mazeUpdate', function(pinfo) {
		//console.log('updating maze');
		var prmzcoor = mzcoor;
		//console.log('old', prmzcoor);
		mzcoor = pinfo['data']['coor'];
		mzsz = pinfo['data']['sz'];
		//console.log('new', mzcoor);
		var sub1 = prmzcoor.diff(mzcoor);
		//console.log('to remove', sub1);
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
				var pl = mzCoor(ind);
				var c = Phoria.Util.generateUnitCube();
				var cube = Phoria.Entity.create({
					id: "Cube Blue",
					points: c.points,
					edges: c.edges,
					polygons: c.polygons,
					style: {
						color: [0, 0, 120]
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
			  color: [0, 0, 1],
			  position: {x:pl[0], y:pl[1]+mzsc, z:pl[2]},
			  intensity: 1,
			  attenuation: 0
		   });
		   visibleLightObj.children.push(light);
		}
		//console.log(mzcube)
	});
	
	var pause = false;
	var fnAnimate = function() {
		if (!pause)
		{
			//console.log('animate');
			//blueLightObj.identity().translate(vec3.fromValues(my_pos[0], my_pos[1], my_pos[2]));
			re_draw();
			scene.modelView();
			renderer.render(scene);
		}
		requestAnimFrame(fnAnimate);
	};
	
	var moveSteps = function(nps){
		//console.log(collide(nps));
		my_pos = nps;
		//console.log(my_pos);
		socket.emit('getMazeCoor', {'id': my_id, 'pos': [my_pos[0], my_pos[1], my_pos[2]]});
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
	
	/* document.addEventListener('mousemove', function(e) {
				pmx = mx;
				pmy = my;
				mx = e.clientX;
				my = e.clientY;
				heading -= (mx-pmx)/1000.0;
				lookAt[1]-=(my-pmy)/1000.0*180/3.14;
				fnPositionLookAt(vec3.fromValues(0,0,0), heading, lookAt);
		}, false); */
		
   requestAnimFrame(fnAnimate);
}
