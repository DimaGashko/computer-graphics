import Geometry from "./Geometry";

export default class GlGeometry {
    public verticesBuffer: WebGLBuffer;
    public colorsBuffer: WebGLBuffer;

    public options = {
        translateX: 0,
        translateY: 0,
        translateZ: 0,

        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,

        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,

        shearXY: 0,
        shearYX: 0,
        shearXZ: 0,
        shearZX: 0,
        shearYZ: 0,
        shearZY: 0,

        reflectX: false,
        reflectY: false,
        reflectZ: false,

        autoRotate: true,
    }

    constructor(private gl: WebGLRenderingContext, public geometry: Geometry) { 
        this.verticesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);

        this.colorsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.colors, gl.STATIC_DRAW);
    }

}