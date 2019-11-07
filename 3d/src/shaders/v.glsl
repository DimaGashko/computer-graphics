
precision mediump float;

attribute vec4 a_position;
attribute vec2 a_texcoords;
attribute vec4 a_color;

uniform mat4 tMatrix;
uniform float time;

varying vec4 color;
varying vec2 texcoord;

void main() {
  gl_Position = tMatrix * a_position;

  color = a_color;
  texcoord = a_texcoords;
}