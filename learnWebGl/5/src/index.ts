import 'normalize.scss/normalize.scss';
import './index.scss';

import { throttle } from 'throttle-debounce';
import hexToRgba from 'hex-to-rgba';
import * as dat from 'dat.gui';

import vShaderSource from './shaders/v.glsl';
import fShaderSource from './shaders/f.glsl';
import Vector from './scripts/math/Vector';
import { createShader, createProgram } from './scripts/webGlUtils';

import f from './geometries/FGeometry/data/vertices';
import TMatrix from './scripts/TMatrix/TMatrix';

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
    fieldOfView: Math.PI / 3,

    translateX: 0,
    translateY: 100,
    translateZ: -500,

    rotateX: -0.25,
    rotateY: 0.1,
    rotateZ: Math.PI,

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
}

const tMatrix = new TMatrix();

const vShader = createShader(gl, gl.VERTEX_SHADER, vShaderSource);
const fShader = createShader(gl, gl.FRAGMENT_SHADER, fShaderSource);
const program = createProgram(gl, vShader, fShader);

const loc = {
    aPosition: gl.getAttribLocation(program, 'a_position'),
    aColor: gl.getAttribLocation(program, 'a_color'),
    tMatrix: gl.getUniformLocation(program, 'tMatrix'),
    baseColor: gl.getUniformLocation(program, 'baseColor'),
    time: gl.getUniformLocation(program, 'time'),
}

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(f.vertices), gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(f.colors), gl.STATIC_DRAW);

initEvents();
resize();
updateTMatrix();
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
    const color = getColor();

    tMatrix.rotateY(0.01);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    gl.enableVertexAttribArray(loc.aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(loc.aPosition, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(loc.aColor);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(loc.aColor, 3, gl.UNSIGNED_BYTE, true, 0, 0);

    gl.uniformMatrix4fv(loc.tMatrix, false, tMatrix.raw);
    gl.uniform1f(loc.time, performance.now() / 1000);
    gl.uniform4f(loc.baseColor, color.r, color.g, color.b, color.a);

    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
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

function getColor() {
    const [r, g, b, a] = hexToRgba(options.color).split(', ')
        .map(c => c.replace(/\D+/g, ''))
        .map(c => +c / 255);

    return { r, g, b, a };
}

function updateTMatrix() {
    const {
        reflectX, reflectY, reflectZ,
        scaleX, scaleY, scaleZ,
        shearXY, shearXZ, shearYX, shearYZ, shearZX, shearZY,
        translateX, translateY, translateZ,
    } = options;

    const ratio = canvasSize.x / canvasSize.y;

    tMatrix.reset();
    tMatrix.perspective(options.fieldOfView, ratio, 1, 2000);
    tMatrix.translate(translateX, translateY, translateZ);
    tMatrix.rotateX(options.rotateX);
    tMatrix.rotateY(options.rotateY);
    tMatrix.rotateZ(options.rotateZ);
    tMatrix.scale(scaleX, scaleY, scaleZ);
    tMatrix.reflect(reflectX, reflectY, reflectZ);
    tMatrix.shear(shearXY, shearYX, shearXZ, shearZX, shearYZ, shearZY);
}

function initGui() {
    const baseOptions = gui.addFolder('Base Options');
    baseOptions.addColor(options, 'color');
    baseOptions.add(options, 'fieldOfView', 0.3, Math.PI - 0.3, 0.01).onChange(updateTMatrix);

    const translate = gui.addFolder('Translate');
    translate.add(options, 'translateX', -500, 500, 1).onChange(updateTMatrix);
    translate.add(options, 'translateY', -500, 500, 1).onChange(updateTMatrix);
    translate.add(options, 'translateZ', -1000, 1, 1).onChange(updateTMatrix);
    translate.open();

    const rotate = gui.addFolder('Rotate');
    rotate.add(options, 'rotateX', -Math.PI, Math.PI, 0.05).onChange(updateTMatrix);
    rotate.add(options, 'rotateY', -Math.PI, Math.PI, 0.05).onChange(updateTMatrix);
    rotate.add(options, 'rotateZ', -Math.PI, Math.PI, 0.05).onChange(updateTMatrix);
    rotate.open();

    const scale = gui.addFolder('Scale');
    scale.add(options, 'scaleX', 0, 5, 0.1).onChange(updateTMatrix);
    scale.add(options, 'scaleY', 0, 5, 0.1).onChange(updateTMatrix);
    scale.add(options, 'scaleZ', 0, 5, 0.1).onChange(updateTMatrix);
    scale.open();

    const shear = gui.addFolder('Shear');
    shear.add(options, 'shearXY', -3, 3, 0.1).onChange(updateTMatrix);
    shear.add(options, 'shearYX', -3, 3, 0.1).onChange(updateTMatrix);
    shear.add(options, 'shearXZ', -3, 3, 0.1).onChange(updateTMatrix);
    shear.add(options, 'shearZX', -3, 3, 0.1).onChange(updateTMatrix);
    shear.add(options, 'shearYZ', -3, 3, 0.1).onChange(updateTMatrix);
    shear.add(options, 'shearZY', -3, 3, 0.1).onChange(updateTMatrix);

    const reflect = gui.addFolder('Reflect');
    reflect.add(options, 'reflectX').onChange(updateTMatrix);
    reflect.add(options, 'reflectY').onChange(updateTMatrix);
    reflect.add(options, 'reflectZ').onChange(updateTMatrix);
}