
precision mediump float;

attribute vec4 a_position;

uniform mat4 affine;
uniform float time;

varying vec4 pos;

void main() {
  gl_Position = affine * a_position;
  pos = gl_Position;
}