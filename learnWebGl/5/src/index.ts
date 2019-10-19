import 'normalize.scss/normalize.scss';
import './index.scss';

import { throttle } from 'throttle-debounce';
import hexToRgba from 'hex-to-rgba';
import * as dat from 'dat.gui';

import vShaderSource from './shaders/v.glsl';
import fShaderSource from './shaders/f.glsl';
import { createShader, createProgram } from './scripts/webGlUtils';

import FGeometry from './geometries/FGeometry/FGeometry';
import Geometry from './geometries/Geometry';
import GlGeometry from './geometries/GlGeometry';
import { hexToGlColor } from './scripts/utils';

const $: {
    canvas?: HTMLCanvasElement,
    [type: string]: HTMLElement
} = {};

$.root = document.querySelector('.app');
$.canvas = $.root.querySelector('.app__canvas');

const gl = $.canvas.getContext('webgl');
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

const gui = new dat.GUI();

const options = {
    baseColor: "#0f0",
    fieldOfView: Math.PI / 3,
}

let baseColor = hexToGlColor(options.baseColor);

let screenW = 0;
let screenH = 0;
let canvasW = 0
let canvasH = 0

const geometries = new Array(5).fill(0)
    .map(() => new FGeometry())
    .map((geometry: Geometry) => {
        return new GlGeometry(gl, geometry);
    });

geometries.map(({ options }) => {
    options.translateX = Math.random() * 500 - 250;
});

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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    geometries.forEach(({ verticesBuffer, colorsBuffer, geometry }) => {
        gl.enableVertexAttribArray(loc.aPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.vertexAttribPointer(loc.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(loc.aColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
        gl.vertexAttribPointer(loc.aColor, 3, gl.UNSIGNED_BYTE, true, 0, 0);

        gl.uniformMatrix4fv(loc.tMatrix, false, geometry.tMatrix.raw);
        gl.uniform1f(loc.time, performance.now() / 1000);
        gl.uniform4f(loc.baseColor, baseColor.r, baseColor.g, baseColor.b, baseColor.a);

        gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
    });
}

function resize() {
    updateMetrics();
    updateCanvasSize();

    geometries.forEach(g => updateTMatrix(g));
}

function updateCanvasSize() {
    $.canvas.width = canvasW;
    $.canvas.height = canvasH;

    gl.viewport(0, 0, canvasW, canvasH);
}

function updateMetrics() {
    screenW = $.root.offsetWidth;
    screenH = $.root.offsetHeight;

    canvasW = Math.floor(screenW * window.devicePixelRatio);
    canvasH = Math.floor(screenH * window.devicePixelRatio);
}

function updateTMatrix(geometry: GlGeometry) {
    const tMatrix = geometry.geometry.tMatrix;

    const ratio = canvasW / canvasH;

    const {
        reflectX, reflectY, reflectZ,
        rotateX, rotateY, rotateZ,
        scaleX, scaleY, scaleZ,
        shearXY, shearXZ, shearYX, shearYZ, shearZX, shearZY,
        translateX, translateY, translateZ,
    } = geometry.options;

    tMatrix.reset();
    tMatrix.perspective(options.fieldOfView, ratio, 1, 2000);
    tMatrix.translate(translateX, translateY, translateZ);
    tMatrix.rotateX(rotateX);
    tMatrix.rotateY(rotateY);
    tMatrix.rotateZ(rotateZ);
    tMatrix.scale(scaleX, scaleY, scaleZ);
    tMatrix.reflect(reflectX, reflectY, reflectZ);
    tMatrix.shear(shearXY, shearYX, shearXZ, shearZX, shearYZ, shearZY);
}

function updateBaseColor() {
    baseColor = hexToGlColor(options.baseColor);
}

function initGui() {
    const baseOptions = gui.addFolder('Base Options');
    baseOptions.addColor(options, 'baseColor').onChange(updateBaseColor);
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