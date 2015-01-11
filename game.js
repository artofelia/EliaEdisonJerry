
var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
                       window.mozRequestAnimationFrame || window.msRequestAnimationFrame || 
                       function(c) {window.setTimeout(c, 15)};
/**
   Phoria
   pho·ri·a (fôr-)
   n. The relative directions of the eyes during binocular fixation on a given object
*/
// bind to window onload event
window.addEventListener('load', onloadHandler, false);
var bitmaps = [];
function onloadHandler()
{
   // get the images loading
   var loader = new Phoria.Preloader();
   for (var i=0; i<6; i++)
   {
      bitmaps.push(new Image());
      loader.addImage(bitmaps[i], 'images/texture'+i+'.png');
   }
   loader.onLoadCallback(init);
}
function init()
{
   // get the canvas DOM element and the 2D drawing context
   var canvas = document.getElementById('canvas');
   canvas.webkitRequestFullScreen();
   canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT); //Chrome
   
   /* var havePointerLock = 'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document;
   //document.pointerLockElement = canvas;
   canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock ||
                            canvas.webkitRequestPointerLock;

	canvas.requestPointerLock()
    document.addEventListener('pointerlockerror', lockError, false);
	document.addEventListener('mozpointerlockerror', lockError, false);
	document.addEventListener('webkitpointerlockerror', lockError, false);

	function lockError(e) {
		console.log(e);
		console.log(e);
		alert("Pointer lock failed"); 
	} */
   
   // create the scene and setup camera, perspective and viewport
   var scene = new Phoria.Scene();
   scene.camera.position = {x:0.0, y:5.0, z:-15.0};
   scene.perspective.aspect = canvas.width / canvas.height;
   scene.viewport.width = canvas.width;
   scene.viewport.height = canvas.height;
   
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
   for (var i=0; i<6; i++)
   {
      cube.textures.push(bitmaps[i]);
      cube.polygons[i].texture = i;
   }
   scene.graph.push(cube);
   scene.graph.push(Phoria.DistantLight.create({
      direction: {x:0, y:-0.5, z:1}
   }));
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
   
   // keep track of heading to generate position
   var heading = 0.0;
   var lookAt = vec3.fromValues(0,-5,15);
   var mx = -1;
	var my = -1;
   var pmx = -1;
   var pmy = -1;
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
      // calcuate rotation based on heading - apply to lookAt offset vector
      rx = lookAt[0]*ca - lookAt[2]*sa,
      rz = lookAt[0]*sa + lookAt[2]*ca;
      vec3.add(pos, pos, vec3.fromValues(rx, lookAt[1], rz));
      // set new camera look at
      scene.camera.lookat.x = pos[0];
      scene.camera.lookat.y = pos[1];
      scene.camera.lookat.z = pos[2];
   }
   
   // key binding
   document.addEventListener('keydown', function(e) {
      switch (e.keyCode)
      {
         case 27: // ESC
            pause = !pause;
            break;
         case 87: // W
            // move forward along current heading
            fnPositionLookAt(vec3.fromValues(0,0,1), heading, lookAt);
            break;
         case 83: // S
            // move back along current heading
            fnPositionLookAt(vec3.fromValues(0,0,-1), heading, lookAt);
            break;
         case 65: // A
            // strafe left from current heading
            fnPositionLookAt(vec3.fromValues(-1,0,0), heading, lookAt);
            break;
         case 68: // D
            // strafe right from current heading
            fnPositionLookAt(vec3.fromValues(1,0,0), heading, lookAt);
            break;
         case 37: // LEFT
            // turn left
            heading += Phoria.RADIANS*4;
            // recalculate lookAt
            // given current camera position, project a lookAt vector along current heading for N units
            fnPositionLookAt(vec3.fromValues(0,0,0), heading, lookAt);
            break;
         case 39: // RIGHT
            // turn right
            heading -= Phoria.RADIANS*4;
            // recalculate lookAt
            // given current camera position, project a lookAt vector along current heading for N units
            fnPositionLookAt(vec3.fromValues(0,0,0), heading, lookAt);
            break;
         case 38: // UP
            lookAt[1]++;
            fnPositionLookAt(vec3.fromValues(0,0,0), heading, lookAt);
            break;
         case 40: // DOWN
            lookAt[1]--;
            fnPositionLookAt(vec3.fromValues(0,0,0), heading, lookAt);
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