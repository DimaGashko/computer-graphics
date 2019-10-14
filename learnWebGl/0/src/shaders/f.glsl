
precision mediump float;

uniform vec4 color;
uniform float time;

varying vec4 c;
varying vec4 c2;

void main() {
  gl_FragColor = vec4(
    sin(c[0] * time),
    cos(c[1] * time),
    sin(c[2] * time), 
    color[3]
  ) + c2;
}