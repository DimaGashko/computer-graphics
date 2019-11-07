
precision mediump float;

attribute vec4 a_position;
attribute vec4 a_color;

uniform mat4 tMatrix;
uniform float time;

varying vec4 color;
varying vec4 pos;

void main() {
  gl_Position = tMatrix * a_position;
  color = a_color;
  pos = gl_Position;
}