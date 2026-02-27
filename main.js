
var canvas;
var gl;

var program;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = false;
var controller;

// These are used to store the current state of objects.
// In animation it is often useful to think of an object as having some DOF
// Then the animation is simply evolving those DOF over time. You could very easily make a higher level object that stores these as Position, Rotation (and also Scale!)
var sphereRotation = [0,0,0];
var spherePosition = [-4,0,0];

var cubeRotation = [0,0,0];
var cubePosition = [-1,0,0];

var cylinderRotation = [0,0,0];
var cylinderPosition = [1.1,0,0];

var coneRotation = [0,0,0];
var conePosition = [3,0,0];

// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse);
	
	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(20,program);
    Cone.init(20,program);
    Sphere.init(36,program);

    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // Lighting Uniforms
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );


    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true;
            resetTimerFlag = true;
            window.requestAnimFrame(render);
        }
        //console.log(animFlag);
    };

    render(0);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();   
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result, x, y, and z are the translation amounts for each axis
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result, theta is the rotation amount, x, y, z are the components of an axis vector (angle, axis rotations!)
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result, x, y, and z are the scale amounts for each axis
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}


function render(timestamp) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    eye = vec3(0, 0, 10);
    MS = []; // Initialize modeling matrix stack
    modelMatrix = mat4(); // Identity matrix
    viewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    setAllMatrices();
    
    if (animFlag) {
        dt = (timestamp - prevTime) / 1000.0;
        prevTime = timestamp;
    }

// Space Jellyfish 
let angle = TIME * 0.3;
let jellyX = 4.0 * Math.cos(angle);
let jellyZ = 4.0 * Math.sin(angle);

// Compute rotation based on direction change 
let prevAngle = (TIME - dt) * 0.3;
let prevJellyX = 4.0 * Math.cos(prevAngle);
let prevJellyZ = 4.0 * Math.sin(prevAngle);

let deltaX = jellyX - prevJellyX;
let deltaZ = jellyZ - prevJellyZ;
let rotationAngle = Math.atan2(deltaZ, deltaX) * (180 / Math.PI);

gPush();
    gTranslate(jellyX, 0, jellyZ);
    gRotate(-rotationAngle, 0, 1, 0); 
    
    // Top Oblate Spheroid 
    gPush();
        gScale(0.4, 0.7, 0.7); 
        setColor(vec4(1.0, 0.3, 0.6, 1.0));
        drawSphere();
    gPop();
    
    // Bottom Oblate Spheroid 
    gPush();
        gTranslate(-0.6, 0, 0); 
        gScale(0.3, 0.5, 0.5); 
        setColor(vec4(1.0, 0.3, 0.5, 1.0));
        drawSphere();
    gPop();
    
    // Tentacles 
    // Tentacle1
    gPush();
        gRotate(10 * Math.sin(TIME * 2), 0, 0, 1);
        gTranslate(-1.0, 0.3, 0);
        gScale(0.2, 0.07, 0.07);
        setColor(vec4(1.0, 0.6, 0.2, 1.0)); 
        //Segment1
        gPush();
          drawSphere();
        gPop();
        //Segment2
        gPush();
          gRotate(20 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-1.8, 0.3, 0);
          drawSphere();
        gPop();
        //Segment3
        gPush();
          gRotate(30 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-3.7, 0.3, 0);
          drawSphere();
        gPop();
        //Segment4
        gPush();
          gRotate(40 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-5.4, 0.3, 0);
          drawSphere();
        gPop();
        //Segment5
        gPush();
          gRotate(50 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-7.2, 0.3, 0);
          drawSphere();
        gPop();
    gPop();
    // Tentacle2
    gPush();
        gRotate(10 * Math.sin(TIME * 2), 0, 0, 1);
        gTranslate(-1.0, 0, 0);
        gScale(0.2, 0.07, 0.07);
        setColor(vec4(1.0, 0.6, 0.2, 1.0)); 
        //Segment1
        gPush();
          drawSphere();
        gPop();
        //Segment2
        gPush();
          gRotate(20 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-1.8, 0, 0);
          drawSphere();
        gPop();
        //Segment3
        gPush();
          gRotate(30 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-3.7, 0, 0);
          drawSphere();
        gPop();
        //Segment4
        gPush();
          gRotate(40 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-5.4, 0, 0);
          drawSphere();
        gPop();
        //Segment5
        gPush();
          gRotate(50 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-7.2, 0, 0);
          drawSphere();
        gPop();
    gPop();
    // Tentacle3
    gPush();
        gRotate(10 * Math.sin(TIME * 2), 0, 0, 1);
        gTranslate(-1.0, -0.3, 0);
        gScale(0.2, 0.07, 0.07);
        setColor(vec4(1.0, 0.6, 0.2, 1.0)); 
        //Segment1
        gPush();
          drawSphere();
        gPop();
        //Segment2
        gPush();
          gRotate(20 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-1.8, -0.3, 0);
          drawSphere();
        gPop();
        //Segment3
        gPush();
          gRotate(30 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-3.7, -0.3, 0);
          drawSphere();
        gPop();
        //Segment4
        gPush();
          gRotate(40 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-5.4, -0.3, 0);
          drawSphere();
        gPop();
        //Segment5
        gPush();
          gRotate(50 * Math.sin(TIME * 3), 0, 0, 1);
          gTranslate(-7.2, -0.3, 0);
          drawSphere();
        gPop();
    gPop();
gPop();

    
    // Astronaut
    // Astronaut move in both the x and y world directions
    let astronautOffsetX = 0.6 * Math.sin(TIME * 0.5); 
    let astronautOffsetY = 0.6 * Math.sin(TIME * 0.5); 
    gPush();
        gTranslate(astronautOffsetX, astronautOffsetY, 0);
    gPush();
        // Head - Sphere with yellow visor
        gPush();
            gScale(0.6, 0.6, 0.6);
            setColor(vec4(1.0, 1.0, 1.0, 1.0));
            drawSphere();
        gPop();
        
        gPush();
            gTranslate(-0.2, 0, 1.0);
            gScale(0.5, 0.3, 0.1); 
            setColor(vec4(1.0, 0.8, 0.2, 1.0));
            drawSphere();
        gPop();
        // Torso
        gPush();
            gTranslate(0, -1.6, 0);
            gRotate(-30, 0, 1, 0);
            gScale(0.7, 1.1, 0.3); 
            setColor(vec4(1.0, 1.0, 1.0, 1.0));
            drawCube();
        gPop();
        //Badges
        gPush();
            gTranslate(-0.4, -0.8, 0.7)
            gScale(0.2, 0.2, 0.2);
            setColor(vec4(0.0, 0.0, 1.0, 1.0));
            drawSphere();
        gPop();

        gPush();
            gTranslate(-0.25, -1.3, 0.7)
            gScale(0.1, 0.1, 0.1);
            setColor(vec4(0.0, 0.0, 1.0, 1.0));
            drawSphere();
        gPop();

        gPush();
            gTranslate(0, -1.3, 0.7)
            gScale(0.1, 0.1, 0.1);
            setColor(vec4(0.0, 0.0, 1.0, 1.0));
            drawSphere();
        gPop();

        gPush();
            gTranslate(-0.5, -1.7, 0.7)
            gScale(0.1, 0.1, 0.1);
            setColor(vec4(0.5, 0.5, 0.5, 1.0));
            drawSphere();
        gPop();

        gPush();
            gTranslate(0.2, -1.7, 0.7)
            gScale(0.1, 0.1, 0.1);
            setColor(vec4(0.5, 0.5, 0.5, 1.0));
            drawSphere();
        gPop();

        gPush();
            gTranslate(-0.3, -2.0, 0.7)
            gScale(0.1, 0.1, 0.1);
            setColor(vec4(1.0, 0.0, 0.0, 1.0));
            drawSphere();
        gPop();

        gPush();
            gTranslate(0, -2.0, 0.7)
            gScale(0.1, 0.1, 0.1);
            setColor(vec4(1.0, 0.0, 0.0, 1.0));
            drawSphere();
        gPop();


        // Legs
        
        // Left Leg 
        gPush();
            gTranslate(-0.4, -3.4, -0.2);
            gRotate(15+8 * Math.sin(TIME * 1), 1, 0, 0);
            gRotate(-30, 0, 1, 0);
            setColor(vec4(1.0, 1.0, 1.0, 1.0));
            
            // Thigh
            gPush();
                gScale(0.25, 0.7, 0.25);
                drawCube();
            gPop();
            
            // Calf
            gPush();
                gRotate(4+8 * Math.sin(TIME * 1), 1, 0, 0);
                gTranslate(0, -1.3, 0);
                gScale(0.25, 0.6, 0.25);
                drawCube();
            gPop();
            
            // Foot
            gPush();
                gRotate(4+8 * Math.sin(TIME * 1), 1, 0, 0);
                gTranslate(0, -1.8, 0);
                gScale(0.25, 0.1, 0.5);
                drawCube();
            gPop();
        gPop();

        //Right leg
         gPush();
         gTranslate(0.4, -3.4, -0.2);
         gRotate(15-8 * Math.sin(TIME * 1), 1, 0, 0);
         gRotate(-30, 0, 1, 0);
         setColor(vec4(1.0, 1.0, 1.0, 1.0));
         
         // Thigh
         gPush();
             gScale(0.25, 0.7, 0.25);
             drawCube();
         gPop();
         
         // Calf
         gPush();
             gRotate(4-8 * Math.sin(TIME * 1), 1, 0, 0);
             gTranslate(0, -1.3, 0);
             gScale(0.25, 0.6, 0.25);
             drawCube();
         gPop();
         
         // Foot
         gPush();
             gRotate(4-8 * Math.sin(TIME * 1), 1, 0, 0);
             gTranslate(0, -1.8, 0);
             gScale(0.25, 0.1, 0.5);
             drawCube();
         gPop();
     gPop();
        
        // Arms
        // Left Arm
        gPush();
            gRotate(-45+5 * Math.sin(TIME * 1), 0, 0, 1);
            gRotate(-15, 0, 1, 0);
            gScale(0.2, 0.7, 0.2);
            gTranslate(-1.2, -2.4, -3.0);
            setColor(vec4(0.8, 0.8, 0.8, 1.0));
            drawCube();
        gPop();
        
        // Right Arm
        gPush();
            gRotate(45+5 * Math.sin(TIME * 1), 0, 0, 1);
            gRotate(-15, 0, 1, 0);
            gScale(0.2, 0.7, 0.2);
            gTranslate(1.2, -2.4, 3.0);
            setColor(vec4(0.8, 0.8, 0.8, 1.0));
            drawCube();
        gPop();
    gPop();
    
    // Stars
// Stars - Initialization (Outside render function)
if (!window.starPositions) {
    window.starPositions = [];
    let starSpeed = 0.03; // Uniform speed for all stars
    for (let i = 0; i < 30; i++) {
        // Initially spawn behind the background (offscreen)
        let startX = (Math.random() * 20) - 10; // Spread out behind the background
        let startY = (Math.random() * 20) - 10;
        window.starPositions.push({
            x: startX,
            y: startY,
            speedX: starSpeed,
            speedY: starSpeed
        });
    }
}

// Stars - Rendering and Movement
for (let i = 0; i < window.starPositions.length; i++) {
    let star = window.starPositions[i];

    // Move the star towards the upper right
    star.x += star.speedX * dt * 60;
    star.y += star.speedY * dt * 60;

    // Reset the star position if it goes offscreen
    if (star.x > 8 || star.y > 8) {
        let spawnEdge = Math.random();
        if (spawnEdge < 0.5) {
            // Reappear from the left side
            star.x = -8;
            star.y = Math.random() * 14 - 7;
        } else {
            // Reappear from the bottom side
            star.x = Math.random() * 14 - 7;
            star.y = -8;
        }
    }

    gPush();
        gTranslate(star.x, star.y, -2);
        let starSize = Math.random() * 0.04 + 0.01; //Random size
        gScale(starSize, starSize, starSize);
        setColor(vec4(1.0, 1.0, 1.0, 1.0));
        drawSphere();
    gPop();
}
    if (animFlag) {
        TIME += dt;
        window.requestAnimFrame(render);
    }
}

