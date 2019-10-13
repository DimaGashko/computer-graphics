
precision mediump float;

uniform vec4 color;
uniform float time;

void main() {
  gl_FragColor = vec4(1.0, color[1], color[2], color[3]);
}