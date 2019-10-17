import 'normalize.scss/normalize.scss';
import './index.scss';

import { throttle } from 'throttle-debounce';
import * as dat from 'dat.gui';

import vShaderSource from './shaders/v.glsl';
import fShaderSource from './shaders/f.glsl';
import Vector from '../src/scripts/Vector';
import { createShader, createProgram } from './scripts/webGlUtils';
import f from './geometries/f';
import matMulMat4 from './scripts/math/matMulMat4';
import { makeIdentity, makeTranslation, makeScale, makeShear, makeRotateX, makeRotateY, makeRotateZ, makeReflect, makeProjection } from './affine';

const $: {
    canvas?: HTMLCanvasElement,
    [type: string]: HTMLElement
} = {};

$.root = document.querySelector('.app');
$.canvas = $.root.querySelector('.app__canvas');

const screenSize = new Vector(0, 0);
const canvasSize = new Vector(0, 0);

const gl = $.canvas.getContext('webgl');
const gui = new dat.GUI();

const options = {
    color: "#0f0",
    depth: 400,

    translateX: 0,
    translateY: 0,
    translateZ: 0,

    scaleX: 0,
    scaleY: 0,
    scaleZ: 0,

    shearXY: 0,
    shearYX: 0,
    shearXZ: 0,
    shearZX: 0,
    shearYZ: 0,
    shearZY: 0,

    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,

    reflectX: false,
    reflectY: false,
    reflectZ: false,
}

let affine = makeIdentity();

const vShader = createShader(gl, gl.VERTEX_SHADER, vShaderSource);
const fShader = createShader(gl, gl.FRAGMENT_SHADER, fShaderSource);
const program = createProgram(gl, vShader, fShader);

const loc = {
    aPosition: gl.getAttribLocation(program, 'a_position'),
    resolution: gl.getUniformLocation(program, 'resolution'),
    time: gl.getUniformLocation(program, 'time'),
}
const positionBuffer = gl.createBuffer();

initEvents();
resize();
start();
initGui();

function initEvents() {
    window.addEventListener('resize', throttle(50, () => {
        resize();
    }));

    window.addEventListener('load', () => {
        resize();
    });
}

function start() {
    requestAnimationFrame(function tik() {
        drawFrame();
        requestAnimationFrame(tik);
    });
}

function drawFrame() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(loc.aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(loc.aPosition, 3, gl.FLOAT, false, 0, 0);

    gl.uniform2f(loc.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(loc.time, performance.now() / 1000);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(f), gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function resize() {
    updateMetrics();
    updateCanvasSize();
}

function updateCanvasSize() {
    $.canvas.width = canvasSize.x;
    $.canvas.height = canvasSize.y;

    gl.viewport(0, 0, canvasSize.x, canvasSize.y);
}

function updateMetrics() {
    screenSize.x = $.root.offsetWidth;
    screenSize.y = $.root.offsetHeight;

    canvasSize.x = Math.floor(screenSize.x * window.devicePixelRatio);
    canvasSize.y = Math.floor(screenSize.y * window.devicePixelRatio);
}

async function loadImages(sources: string[]) {
    const images = [];
    const promises = sources.map(async (src) => {
        images.push(await loadImg(src));
    });

    await Promise.all(promises);
    return images;
}

function loadImg(src: string) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = reject;

        img.src = src;
    });
}

function updateAffine() {
    const {
        reflectX, reflectY, reflectZ,
        scaleX, scaleY, scaleZ,
        shearXY, shearXZ, shearYX, shearYZ, shearZX, shearZY,
        translateX, translateY, translateZ,
    } = options;

    affine = rotateX(affine, options.rotateX);
    affine = rotateY(affine, options.rotateY);
    affine = rotateZ(affine, options.rotateZ);
    affine = reflect(affine, reflectX, reflectY, reflectZ);
    affine = scale(affine, scaleX, scaleY, scaleZ);
    affine = shear(affine, shearXY, shearYX, shearXZ, shearZX, shearYZ, shearZY);
    affine = translate(affine, translateX, translateY, translateZ);
    affine = projection(affine, canvasSize.x, canvasSize.y, options.depth);
}

function translate(affine: number[], dx: number, dy: number, dz: number) {
    return matMulMat4(makeTranslation(dx, dy, dz), affine);
}

function scale(affine: number[], cx: number, cy: number, cz: number) {
    return matMulMat4(makeScale(cx, cy, cz), affine);
}

function shear(affine: number[], xy: number, yx: number, xz: number, zx: number, yz: number, zy: number) {
    return matMulMat4(makeShear(xy, yx, xz, xz, yz, zy), affine);
}

function rotateX(affine: number[], deg: number) {
    return matMulMat4(makeRotateX(deg), affine);
}

function rotateY(affine: number[], deg: number) {
    return matMulMat4(makeRotateY(deg), affine);
}

function rotateZ(affine: number[], deg: number) {
    return matMulMat4(makeRotateZ(deg), affine);
}

function reflect(affine: number[], cx: boolean, cy: boolean, cz: boolean) {
    return matMulMat4(makeReflect(cx, cy, cz), affine);
}

function projection(affine: number[], width: number, height: number, depth: number) { 
    return matMulMat4(makeProjection(width, height, depth), affine);
}

function initGui() {
    const baseOptions = gui.addFolder('Base Options');
    baseOptions.addColor(options, 'color');
    baseOptions.add(options, 'depth', 0, 1000);

    const translate = gui.addFolder('Translate');
    translate.add(options, 'translateX', -500, 500).onChange(updateAffine);
    translate.add(options, 'translateY', -500, 500).onChange(updateAffine);
    translate.add(options, 'translateZ', -500, 500).onChange(updateAffine);
    translate.open();

    const rotate = gui.addFolder('Rotate');
    rotate.add(options, 'rotateX', -Math.PI, Math.PI).onChange(updateAffine);
    rotate.add(options, 'rotateY', -Math.PI, Math.PI).onChange(updateAffine);
    rotate.add(options, 'rotateZ', -Math.PI, Math.PI).onChange(updateAffine);
    rotate.open();

    const scale = gui.addFolder('Scale');
    scale.add(options, 'scaleX', 0, 5).onChange(updateAffine);
    scale.add(options, 'scaleY', 0, 5).onChange(updateAffine);
    scale.add(options, 'scaleZ', 0, 5).onChange(updateAffine);
    scale.open();

    const shear = gui.addFolder('Shear');
    shear.add(options, 'shearXY', -3, 3).onChange(updateAffine);
    shear.add(options, 'shearYX', -3, 3).onChange(updateAffine);
    shear.add(options, 'shearXZ', -3, 3).onChange(updateAffine);
    shear.add(options, 'shearZX', -3, 3).onChange(updateAffine);
    shear.add(options, 'shearYZ', -3, 3).onChange(updateAffine);
    shear.add(options, 'shearZY', -3, 3).onChange(updateAffine);

    const reflect = gui.addFolder('Reflect');
    reflect.add(options, 'reflectX').onChange(updateAffine);
    reflect.add(options, 'reflectY').onChange(updateAffine);
    reflect.add(options, 'reflectZ').onChange(updateAffine);
}