
precision mediump float;

attribute vec4 a_position;

uniform vec2 resolution;
uniform float time;

uniform mat4 affine;

varying vec4 color;

void main() {
  gl_Position = vec4(a_position.xy / resolution, 0, 1);

  color = a_position;
}