
precision mediump float;

attribute vec4 a_position;

uniform vec2 resolution;
uniform float time;

uniform mat4 affine;

void main() {
  gl_Position = affine * a_position;
}