
precision mediump float;

uniform float time;
uniform vec4 baseColor;

varying vec4 pos;
varying vec4 color;

void main() {
  gl_FragColor = color * baseColor;
}