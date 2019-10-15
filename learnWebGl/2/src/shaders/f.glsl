
precision mediump float;

uniform sampler2D image;
uniform sampler2D image2;
uniform vec2 texSize;
uniform float time;

varying vec4 c;
varying vec2 texCoord;
//varying vec2 tex2Coord;

void main() {
   vec4 c = texture2D(image, vec2(
     texCoord.x + cos(texCoord.y * 20.0 + time * 2.13) / 500.0,
     texCoord.y + sin(texCoord.y * 20.0 + time * 0.8) / 1000.0
   ));

   vec4 c2 = texture2D(image2, vec2(
     texCoord.x + sin((texCoord.y * 3.0 + time) * 5.0) / 1000.0,
     texCoord.y + cos(texCoord.x * 2.0 + time) / 25.0
   ));

   if (c2.a == 0.0) {
     gl_FragColor = c;
   } else {
     gl_FragColor = vec4(c2.rgb, 1);
   }

   
}