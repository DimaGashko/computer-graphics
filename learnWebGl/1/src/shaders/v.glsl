
precision mediump float;

attribute vec2 a_position;

uniform vec2 resolution;
uniform float time;

varying vec4 c;

void main() {
  vec2 clipSpace = ((a_position / resolution) * 2.0) - 1.0;

  gl_Position = vec4(clipSpace, 0, 1);

  c = gl_Position * 0.5 + 0.5;
}