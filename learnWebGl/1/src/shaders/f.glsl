
precision mediump float;

uniform sampler2D image;
uniform float time;

varying vec4 c;
varying vec2 texCoord;

void main() {
  gl_FragColor = texture2D(image, vec2(
    texCoord.x * 0.9 + cos((time + texCoord.y) / 100.0) / 1000.0, 
    texCoord.y * 0.8 + sin(time + texCoord.x) * 0.04
  ));
}