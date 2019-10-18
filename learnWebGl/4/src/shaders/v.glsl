
precision mediump float;

attribute vec4 a_position;
attribute vec4 a_color;

uniform mat4 affine;
uniform float time;

varying vec4 pos;
varying vec4 color;

void main() {
  gl_Position = affine * a_position;

  pos = gl_Position;
  color = a_color;
}