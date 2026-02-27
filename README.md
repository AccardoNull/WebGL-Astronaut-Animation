# WebGL-Astronaut-Animation

Animation showcase: https://accardonull.github.io/WebGL-Astronaut-Animation/

Usage:

- Press 'Toggle Animation' button to start the scene.

Features included:

- The program utilize real-time to synchronize animations, all animated rotation use 'Time' variable to calculate object's movements.

- The program draws an astronaut, the head of which is made of a white sphere and a yellow scaled sphere as vision. The torso is made of a white scaled cube, with badges made of blue/grey/red scaled spheres, with two arms made of two scaled cubes, which has animated rotation implemented. The two legs each includes three scaled cubs represent hips, knees and feet, with a kicking animation implemented for hips and knees, the feet doesn't move itself but rotate with the rest. The character as a whole also moves in both x and y axis direction.

- The program also draws a jellyfish, with head made of two scaled purple sphere, and has three tentacles each made of 5 segments of scaled yellow sphere and are connected with the lower part of the head, the jellyfish moves in circle around the astronaut and is aligned with the tangent of the circle, each segments of the tentacles includes rotation that make up a wave like movement effect.

- The program draws a black background, with randomize sized small sphere represent stars, that first spawned behind the background, they would all move towards up right until offscreen, after which they would respawn from the bottom left offscreen then move towards up right again. The number of star objects remains static, as they are reused after they fly off-screen.

- The code includes commentaries that explain the progress. 

- The scene is set as 512x512.
