
precision mediump float;

uniform sampler2D image;
uniform float time;

varying vec4 c;
varying vec2 texCoord;

vec2 hash(vec2 p) {
  mat2 m = mat2(13.85, 47.77, 99.41, 88.48);

  return fract(sin(m * p) * 46738.29);
}

float voronoi(vec2 p) {
  vec2 g = floor(p);
  vec2 f = fract(p);

  float distanceToClosestFeaturePoint = 1.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 latticePoint = vec2(x, y);
      float currentDistance =
          distance(latticePoint + hash(g + latticePoint), f);
      distanceToClosestFeaturePoint =
          min(distanceToClosestFeaturePoint, currentDistance);
    }
  }

  return distanceToClosestFeaturePoint;
}

void main() {
  gl_FragColor = texture2D(image, vec2(
    texCoord.x * 0.9 + cos((time + texCoord.y) / 100.0) / 1000.0, 
    texCoord.y * 0.8 + sin(time + texCoord.x) * 0.04
  ));

  vec2 resolution = vec2(5000,2060);

  vec2 uv = (texCoord.xy / resolution.xy) * 2.0 - 1.0;
  uv.x *= resolution.x / resolution.y;
  uv = texCoord;

  float offset = voronoi(uv * 10.0 + vec2(time));
  float t = 1.0 / abs(((uv.x + sin(uv.y + time)) + offset) * 30.0);

  float r = voronoi(uv * .5) * 1.0;
  vec3 finalColor = vec3(10.0 * uv.y, 2.0, 1.0 * r) * t;

  gl_FragColor = gl_FragColor / 2.0 + vec4(finalColor, 1.0);
}