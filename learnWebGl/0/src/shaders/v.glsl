
precision mediump float;

attribute vec2 a_position;
attribute vec4 a_color;

uniform vec2 resolution;
uniform float time;

varying vec4 c;
varying vec4 c2;

void main() {
  vec2 clipSpace = ((a_position / resolution) * 2.0) - 1.0;

  gl_Position = vec4(
    clipSpace.x,
    clipSpace.y,
    0, 1);

  c = gl_Position * 0.5 + 0.5;
  c2 = a_color;
}