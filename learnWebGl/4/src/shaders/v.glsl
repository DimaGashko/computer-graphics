
precision mediump float;

attribute vec4 a_position;
attribute vec4 a_color;

uniform mat4 affine;
uniform float time;
uniform float fudgeFactor;

varying vec4 color;

void main() {
  vec4 pos = affine * a_position;

  gl_Position = vec4(pos.xy / (1.0 + pos.z * fudgeFactor), pos.zw);

  color = a_color;
}