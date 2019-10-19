
precision mediump float;

uniform float time;
uniform vec4 baseColor;
uniform vec4 geometryBaseColor;

varying vec4 color;
varying vec4 pos;

void main() {
  gl_FragColor = color * (baseColor + geometryBaseColor) * 0.5;
}