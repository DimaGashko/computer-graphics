
precision mediump float;

attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute vec2 a_tex2Coord;

uniform vec2 resolution;
uniform float time;

varying vec4 c;
varying vec2 texCoord;
varying vec2 tex2Coord;

void main() {
  vec2 clipSpace = ((a_position / resolution) * 2.0) - 1.0;

  gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);

  c = gl_Position * 0.5 + 0.5;

  texCoord = a_texCoord;
  tex2Coord = a_tex2Coord;
}