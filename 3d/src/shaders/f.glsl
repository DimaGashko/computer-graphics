
precision mediump float;

// uniform float time;
// uniform vec4 baseColor;

varying vec4 color;
varying vec4 pos;

varying vec2 texcoord;

uniform sampler2D texture;

void main() {
  // gl_FragColor = color * baseColor;
  // gl_FragColor.a = 0.25;

  gl_FragColor = texture2D(texture, texcoord);
}