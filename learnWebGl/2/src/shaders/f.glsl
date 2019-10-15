
precision mediump float;

uniform sampler2D image;
uniform vec2 texSize
uniform float time;
uniform float kernel[9];
uniform float kernelWeight;

varying vec4 c;
varying vec2 texCoord;

void main() {
  vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;

  vec4 colorSum =
     texture2D(image, texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
     texture2D(image, texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
     texture2D(image, texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
     texture2D(image, texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
     texture2D(image, texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
     texture2D(image, texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
     texture2D(image, texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
     texture2D(image, texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
     texture2D(image, texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;

  gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);
}