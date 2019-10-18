
precision mediump float;

attribute vec4 a_position;

uniform vec2 resolution;
uniform float time;

uniform mat4 affine;

void main() {
  vec4 c = affine * a_position;
  gl_Position = vec4(c.xy / resolution, a_position.z, 1);
}