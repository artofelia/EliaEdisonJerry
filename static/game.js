
var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
                       window.mozRequestAnimationFrame || window.msRequestAnimationFrame || 
                       function(c) {window.setTimeout(c, 15)};

window.addEventListener('load', onloadHandler, false);
var bitmaps = [];
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

function init()
{
   // get the canvas DOM element and the 2D drawing context
   var canvas = document.getElementById('canvas');
	
   
   // create the scene and setup camera, perspective and viewport
   var scene = new Phoria.Scene();
   scene.camera.position = {x:-10.0, y:5.0, z:-15.0};
   scene.perspective.aspect = canvas.width / canvas.height;
   scene.viewport.width = canvas.width;
   scene.viewport.height = canvas.height;
      /**
    * @param forward {vec3}   Forward movement offset
    * @param heading {float}  Heading in Phoria.RADIANS
    * @param lookAt {vec3}    Lookat projection offset from updated position
    */
   var fnPositionLookAt = function positionLookAt(forward, heading, lookAt) {
      // recalculate camera position based on heading and forward offset
      var pos = vec3.fromValues(
         scene.camera.position.x,
         scene.camera.position.y,
         scene.camera.position.z);
      var ca = Math.cos(heading), sa = Math.sin(heading);
      var rx = forward[0]*ca - forward[2]*sa,
          rz = forward[0]*sa + forward[2]*ca;
      forward[0] = rx;
      forward[2] = rz;
      vec3.add(pos, pos, forward);
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
   
   // key binding

   // create a canvas renderer
   var renderer = new Phoria.CanvasRenderer(canvas);
   
   // add a grid to help visualise camera position etc.
   var plane = Phoria.Util.generateTesselatedPlane(8,8,0,20);
   scene.graph.push(Phoria.Entity.create({
      points: plane.points,
      edges: plane.edges,
      polygons: plane.polygons,
      style: {
         drawmode: "wireframe",
         shademode: "plain",
         linewidth: 0.5,
         objectsortmode: "back"
      }
   }));
   
  var player_cube = [];  
   var draw_cube = function(key){
		cube = players[key]['cube'];
		//console.log(players[key]['pos']);
		cube.identity().rotateZ(3.14/2);//players[key]['heading']*Phoria.RADIANS);
		cube.identity().translate(vec3.fromValues(players[key]['pos'][0], players[key]['pos'][1], players[key]['pos'][2]));
		
	}

   //my info
   var mi = 50;
   var heading = 0.0;
   var lookAt = vec3.fromValues(0,-5,15);
   var my_pos = [scene.camera.position.x, scene.camera.position.y, scene.camera.position.z];
   console.log('inital position', my_pos);
   
   var my_id = -1;
   var players = {}
   
   var re_draw = function(){
	//console.log('draw ', Object.keys(players).length);
	for (var key in players){
   		draw_cube(key);
   	}
   }

   var socket = io.connect('http://' + document.domain + ':' + location.port + '/test');
   socket.on('connect', function() {
		console.log('connecting');
			console.log('sending pos to server', my_pos);
        	socket.emit('addPlayer', {'pos': [my_pos[0], my_pos[1], my_pos[2]], 'heading': heading});
   });
            // event handler for server sent data
            // the data is displayed in the "Received" section of the page
   socket.on('set_id', function(msg) {
    	my_id = msg['id'];
   });
   socket.on('set_players', function(msg) {
    	console.log('setting prev player', Object.keys(msg).length);
		for(var key in msg){
			players[key] = msg[key];
			var c = Phoria.Util.generateUnitCube();
			var cube = Phoria.Entity.create({
				 points: c.points,
				 edges: c.edges,
				 polygons: c.polygons
			});
			scene.graph.push(cube);
			players[key]['cube'] = cube;
		}
		});

   socket.on('playerAdded', function(pinfo) {
		var ky = pinfo['key'];
		if (pinfo['data']['id'] != my_id){
        	console.log('player added');
			players[ky] = pinfo['data'];
			console.log('player added pos is ', players[ky]['pos']);
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
			players[ky]['cube'] = cube;
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


   var pause = false;
   var fnAnimate = function() {
      if (!pause)
      {
         //console.log('animate');
		 re_draw();
         scene.modelView();
         renderer.render(scene);
      }
      requestAnimFrame(fnAnimate);
   };
   
   // keep track of heading to generate position
 
 

   document.addEventListener('keydown', function(e) {
      switch (e.keyCode)
      {
         case 27: // ESC
            pause = !pause;
            break;
         case 87: // W
            // move forward along current heading
            my_pos = fnPositionLookAt(vec3.fromValues(0,0,1), heading, lookAt);
			//console.log(my_pos);
            socket.emit('playerMoved', {'id': my_id, 'pos': [my_pos[0], my_pos[1], my_pos[2]]});
            break;
         case 83: // S
            // move back along current heading
            my_pos = fnPositionLookAt(vec3.fromValues(0,0,-1), heading, lookAt);
            socket.emit('playerMoved', {'id': my_id, 'pos': [my_pos[0], my_pos[1], my_pos[2]]});
            break;
         case 65: // A
            // strafe left from current heading
            my_pos = fnPositionLookAt(vec3.fromValues(-1,0,0), heading, lookAt);
            
            socket.emit('playerMoved', {'id': my_id, 'pos': [my_pos[0], my_pos[1], my_pos[2]]});
	    break;
         case 68: // D
            // strafe right from current heading
            my_pos = fnPositionLookAt(vec3.fromValues(1,0,0), heading, lookAt);       
            socket.emit('playerMoved', {'id': my_id, 'pos': [my_pos[0], my_pos[1], my_pos[2]]});
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
