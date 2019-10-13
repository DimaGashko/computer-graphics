
precision mediump float;

uniform vec4 color;
uniform float time;

void main() {
  gl_FragColor = vec4(
    sin(color[0] * time),
    cos(color[1] * time),
    sin(color[2] * time), 
    color[3]
  );
}