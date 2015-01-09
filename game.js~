
var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame || window.msRequestAnimationFrame ||
function(c) {window.setTimeout(c, 15)};
window.addEventListener('load', onloadHandler, false);

function onloadHandler()
{
	// get the canvas DOM element and the 2D drawing context
	var canvas = document.getElementById('canvas');
	// create the scene and setup camera, perspective and viewport
	var scene = new Phoria.Scene();

	scene.camera.position = {x:0.0, y:5.0, z:-15.0};
	var pos = vec3.fromValues(0, 5, -15);

	scene.camera.lookat = {x:0.0, y:0.0, z:1.0};
	var lookat = vec3.fromValues(0, 0, 0);
	var dir = vec3.fromValues(0, 0, 1);
	var up = vec3.fromValues(0,1,0);
	var rt = vec3.fromValues(0,0,0);
	vec3.cross(rt, up, dir);

	scene.perspective.aspect = canvas.width / canvas.height;
	scene.viewport.width = canvas.width;
	scene.viewport.height = canvas.height;
	
	var dispVec = function(inp){
		return [inp[0], inp[1], inp[2]];
	}
	var setCameraPos = function(inp){
		scene.camera.position.x = inp[0];
		scene.camera.position.y = inp[1];
		scene.camera.position.z = inp[2];
	}

	var setCameraLookat = function(inp){
		scene.camera.lookat.x = inp[0];
		scene.camera.lookat.y = inp[1];
		scene.camera.lookat.z = inp[2];
	}
	var dispCameraLookat = function(){
		return [scene.camera.lookat.x,scene.camera.lookat.y,scene.camera.lookat.z,scene.camera.lookat.w];
	}
	var dispCameraPos = function(){
		return [scene.camera.position.x,scene.camera.position.y,scene.camera.position.z,scene.camera.position.w];
	}


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
	var c = Phoria.Util.generateUnitCube();
	var cube = Phoria.Entity.create({
		points: c.points,
		edges: c.edges,
		polygons: c.polygons
		});
	scene.graph.push(cube);
	scene.graph.push(new Phoria.DistantLight());
	var pause = false;
	var fnAnimate = function() {
		if (!pause)
		{
			// rotate local matrix of the cube
			cube.rotateY(0.5*Phoria.RADIANS);
			// execute the model view 3D pipeline and render the scene
			scene.modelView();
			renderer.render(scene);
		}
		requestAnimFrame(fnAnimate);
		};

	var spd = 2;
	// key binding
	document.addEventListener('keydown', function(e) {
		console.log(e.keyCode);
		switch (e.keyCode)
			{
				case 27: // ESC
				pause = !pause;
				break;

				case 87: //W
				vec3.normalize(dir, dir);
				vec3.scale(dir, dir, spd);
				vec3.add(pos, pos, dir);
				vec3.add(lookat, pos, dir);
				setCameraLookat(lookat);
				setCameraPos(pos);
				console.log(dispCameraLookat());
				break;
			
				case 83: //S
				vec3.normalize(dir, dir);
				vec3.scale(dir, dir, spd);
				vec3.subtract(pos, pos, dir);
				vec3.add(lookat, pos, dir);
				setCameraLookat(lookat);
				setCameraPos(pos);
				break;

				case 68: //D
				vec3.normalize(dir, dir);
				vec3.cross(rt, up, dir);
				vec3.normalize(rt, rt);
				vec3.scale(rt, rt, spd);
				vec3.add(pos, pos, rt);
				vec3.add(lookat, pos, dir);
				setCameraLookat(lookat);
				setCameraPos(pos);
				break;

				case 65: //A
				vec3.normalize(dir, dir);
				vec3.cross(rt, up, dir);
				vec3.normalize(rt, rt);
				vec3.scale(rt, rt, spd);
				vec3.subtract(pos, pos, rt);
				vec3.add(lookat, pos, dir);
				setCameraLookat(lookat);
				setCameraPos(pos);
				break;
			}
		}, false);
		document.addEventListener('onmousemove', function(e) {
			x = e.clientX;			
			console.log("registere mouse");
	
		}, false);


	requestAnimFrame(fnAnimate);
}
