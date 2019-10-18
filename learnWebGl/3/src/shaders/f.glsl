
precision mediump float;

uniform float time;
uniform vec4 color;

varying vec4 pos;

void main() {
  gl_FragColor = color / pos;
}