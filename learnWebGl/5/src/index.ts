import 'normalize.scss/normalize.scss';
import './index.scss';

import { throttle } from 'throttle-debounce';
import * as dat from 'dat.gui';

import vShaderSource from './shaders/v.glsl';
import fShaderSource from './shaders/f.glsl';
import { createShader, createProgram } from './scripts/webGlUtils';

import FGeometry from './geometries/FGeometry/FGeometry';
import Geometry from './geometries/Geometry';
import GlGeometry from './geometries/GlGeometry';
import { hexToGlColor } from './scripts/utils';
import TMatrix from './scripts/TMatrix';
import { makePerspective } from './scripts/affine';

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
    baseColor: "#0b0",
    rotateSpeed: 0.01,

    fieldOfView: Math.PI / 3,
    near: 1,
    far: 5000,

    activeGeometry: 'Geometry 1',
    baseGlColor: null,
}

const camera = {
    translateX: 0,
    translateY: 0,
    translateZ: 0,

    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
}

options.baseGlColor = hexToGlColor(options.baseColor);

let screenW = 0;
let screenH = 0;
let canvasW = 0;
let canvasH = 0;
let ratio = 0;

let viewMatrix: TMatrix;

const geometries = new Array(10000).fill(0)
    .map(() => new FGeometry())
    .map((geometry: Geometry) => {
        return new GlGeometry(gl, geometry);
    });

geometries.map(({ options }, i, { length }) => {
    const side = Math.cbrt(length) ^ 0;

    const x = i % side;
    const y = (i / (side ** 2)) ^ 0;
    const z = ((i / side) ^ 0) % side;
    const size = 180;
    const k = 1.1;

    const offset = - (size * side) / 2;

    options.translateX = offset + x * size * k;
    options.translateY = offset + y * size * k;
    options.translateZ = -900 - z * size * k;
});

initEvents();
resize();
initGui();
start();

function initEvents() {
    window.addEventListener('resize', throttle(1000, () => {
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

let prevTime = performance.now() / 1000;
function drawFrame() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    const time = performance.now();

    //updateAllTMatrices();

    geometries.forEach(({ verticesBuffer, colorsBuffer, geometry, options: gOptions }) => {
        gOptions.rotateY += (options.rotateSpeed * (time - prevTime) / 16);

        gl.enableVertexAttribArray(loc.aPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.vertexAttribPointer(loc.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(loc.aColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
        gl.vertexAttribPointer(loc.aColor, 3, gl.UNSIGNED_BYTE, true, 0, 0);

        gl.uniformMatrix4fv(loc.tMatrix, false, geometry.tMatrix.tMatrix);
        gl.uniform1f(loc.time, time / 1000);

        let { r, g, b } = options.baseGlColor;
        gl.uniform4f(loc.baseColor, r, g, b, 1);

        gl.drawArrays(gl.TRIANGLES, 0, geometry.primitiveCount);
    });

    prevTime = time;
}

function resize() {
    updateMetrics();
    updateCanvasSize();
    updateViewMatrix();
    updateAllTMatrices();
}

function updateCanvasSize() {
    $.canvas.width = canvasW;
    $.canvas.height = canvasH;

    gl.viewport(0, 0, canvasW, canvasH);
}

function updateMetrics() {
    screenW = $.canvas.clientWidth;
    screenH = $.canvas.clientHeight;

    canvasW = Math.floor(screenW * window.devicePixelRatio);
    canvasH = Math.floor(screenH * window.devicePixelRatio);

    ratio = canvasH / canvasH;
}

function updateViewMatrix() { 
    const { fieldOfView, near, far } = options;
    const { translateX, translateY, translateZ, rotateX, rotateY, rotateZ } = camera;
    
    viewMatrix = new TMatrix()
        .rotateY(rotateX)
        .rotateY(rotateY)
        .rotateZ(rotateZ)
        .translate(translateX, translateY, translateZ)
        .inverse()
        .perspective(fieldOfView, ratio, near, far);
}

function updateAllTMatrices() {
    geometries.forEach(g => updateTMatrix(g));
}

function updateTMatrix(geometry: GlGeometry) {
    const tMatrix = geometry.geometry.tMatrix;

    const {
        reflectX, reflectY, reflectZ,
        rotateX, rotateY, rotateZ,
        scaleX, scaleY, scaleZ,
        shearXY, shearXZ, shearYX, shearYZ, shearZX, shearZY,
        translateX, translateY, translateZ,
    } = geometry.options;

    tMatrix.reset(viewMatrix.tMatrix)
        .translate(translateX, translateY, translateZ)
        .rotateX(rotateX)
        .rotateY(rotateY)
        .rotateZ(rotateZ)
        .scale(scaleX, scaleY, scaleZ)
        .reflect(reflectX, reflectY, reflectZ)
        .shear(shearXY, shearYX, shearXZ, shearZX, shearYZ, shearZY);
}

function getActiveGeometryOptions() {
    const index = +options.activeGeometry.replace(/\D+/g, '') - 1;
    return geometries[index];
}

function initGui() {
    gui.domElement.classList.add('gui-root');
    gui.close();

    const baseOptions = gui.addFolder('Base Options');
    let geometryFolder = gui.addFolder(`Geometry`);

    baseOptions.open();
    geometryFolder.open();

    baseOptions.addColor(options, 'baseColor').onChange(() => {
        options.baseGlColor = hexToGlColor(options.baseColor);
    });

    baseOptions.add(options, 'rotateSpeed', -0.1, 0.1, 0.001);
    baseOptions.add(options, 'fieldOfView', 0.3, Math.PI - 0.3, 0.01).onChange(() => {
        updateViewMatrix();
        updateAllTMatrices();
    });

    baseOptions.add(options, 'activeGeometry', geometries.map((_, i) => `Geometry ${i + 1}`)).onChange(() => {
        for (let key in geometryFolder.__folders) {
            geometryFolder.removeFolder(geometryFolder.__folders[key]);
        }

        initGeometryGui(geometryFolder);
    });

    initGeometryGui(geometryFolder);
}

function initGeometryGui(geometryFolder: dat.GUI) {
    const { options } = getActiveGeometryOptions();

    const translate = geometryFolder.addFolder('Translate');
    translate.add(options, 'translateX', -500, 500, 1);
    translate.add(options, 'translateY', -500, 500, 1);
    translate.add(options, 'translateZ', -2000, 1, 1);
    translate.open();

    const rotate = geometryFolder.addFolder('Rotate');
    rotate.add(options, 'rotateX', -Math.PI, Math.PI, 0.05);
    rotate.add(options, 'rotateY', -Math.PI, Math.PI, 0.05);
    rotate.add(options, 'rotateZ', -Math.PI, Math.PI, 0.05);
    rotate.open();

    const scale = geometryFolder.addFolder('Scale');
    scale.add(options, 'scaleX', 0, 5, 0.1);
    scale.add(options, 'scaleY', 0, 5, 0.1);
    scale.add(options, 'scaleZ', 0, 5, 0.1);
    scale.open();

    const shear = geometryFolder.addFolder('Shear');
    shear.add(options, 'shearXY', -3, 3, 0.1);
    shear.add(options, 'shearYX', -3, 3, 0.1);
    shear.add(options, 'shearXZ', -3, 3, 0.1);
    shear.add(options, 'shearZX', -3, 3, 0.1);
    shear.add(options, 'shearYZ', -3, 3, 0.1);
    shear.add(options, 'shearZY', -3, 3, 0.1);

    const reflect = geometryFolder.addFolder('Reflect');
    reflect.add(options, 'reflectX');
    reflect.add(options, 'reflectY');
    reflect.add(options, 'reflectZ');
}