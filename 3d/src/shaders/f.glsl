
precision mediump float;

uniform float time;
uniform vec4 baseColor;

varying vec4 color;
varying vec4 pos;

void main() {
  gl_FragColor = color * baseColor;
}