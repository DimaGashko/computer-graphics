
precision mediump float;

attribute vec2 a_position;

uniform vec2 resolution;
uniform float time;

void main() {
  vec2 clipSpace = ((a_position / resolution) * 2.0) - 1.0;

  gl_Position = vec4(clipSpace * vec2(sin(time) / 2.0 + 1.0, -1.0 * sin(time)), 0, 1);
}