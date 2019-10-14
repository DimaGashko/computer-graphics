
precision mediump float;

uniform sampler2D image;
uniform float time;

varying vec4 c;
varying vec2 texCoord;

void main() {
  gl_FragColor = texture2D(image, vec2(
    texCoord.x, 
    texCoord.y + sin(time / 10.0)
  ));
}