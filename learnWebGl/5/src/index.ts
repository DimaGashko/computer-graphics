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
    geometryBaseColor: gl.getUniformLocation(program, 'geometryBaseColor'),
    time: gl.getUniformLocation(program, 'time'),
}

const gui = new dat.GUI();

const options = {
    baseColor: "#0f0",
    rotateSpeed: 0.01,
    fieldOfView: Math.PI / 3,

    activeGeometry: 'Geometry 1',
    baseGlColor: null,
}

options.baseGlColor = hexToGlColor(options.baseColor);

let screenW = 0;
let screenH = 0;
let canvasW = 0
let canvasH = 0

const geometries = new Array(512).fill(0)
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

    geometries.forEach(({ verticesBuffer, colorsBuffer, geometry, options: gOptions }) => {
        geometry.tMatrix.rotateY(options.rotateSpeed);

        gl.enableVertexAttribArray(loc.aPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.vertexAttribPointer(loc.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(loc.aColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
        gl.vertexAttribPointer(loc.aColor, 3, gl.UNSIGNED_BYTE, true, 0, 0);

        gl.uniformMatrix4fv(loc.tMatrix, false, geometry.tMatrix.raw);
        gl.uniform1f(loc.time, time / 1000);

        let { r, g, b } = options.baseGlColor;
        gl.uniform4f(loc.baseColor, r, g, b, 1);
        ({ r, g, b } = gOptions.baseGlColor);
        gl.uniform4f(loc.geometryBaseColor, r, g, b, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
    });

    prevTime = time;
}

function resize() {
    updateMetrics();
    updateCanvasSize();
    updateAllTMatrices();
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

function updateAllTMatrices() {
    geometries.forEach(g => updateTMatrix(g));
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
    tMatrix.perspective(options.fieldOfView, ratio, 1, 3000);
    tMatrix.translate(translateX, translateY, translateZ);
    tMatrix.rotateX(rotateX);
    tMatrix.rotateY(rotateY);
    tMatrix.rotateZ(rotateZ);
    tMatrix.scale(scaleX, scaleY, scaleZ);
    tMatrix.reflect(reflectX, reflectY, reflectZ);
    tMatrix.shear(shearXY, shearYX, shearXZ, shearZX, shearYZ, shearZY);
}

function getActiveGeometryOptions() {
    const index = +options.activeGeometry.replace(/\D+/g, '') - 1;
    return geometries[index];
}

function initGui() {
    gui.domElement.classList.add('gui-root');

    const baseOptions = gui.addFolder('Base Options');
    let geometryFolder = gui.addFolder(`Geometry`);

    baseOptions.open();
    geometryFolder.open();

    baseOptions.addColor(options, 'baseColor').onChange(() => { 
        options.baseGlColor = hexToGlColor(options.baseColor);
    });

    baseOptions.add(options, 'rotateSpeed', -0.1, 0.1, 0.001);
    baseOptions.add(options, 'fieldOfView', 0.3, Math.PI - 0.3, 0.01).onChange(() => {
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
    const geometry = getActiveGeometryOptions();
    const update = () => { updateTMatrix(geometry) };
    const { options } = geometry;

    const styles = geometryFolder.addFolder('Styles');
    styles.addColor(options, 'baseColor').onChange(() => {
        options.baseGlColor = hexToGlColor(options.baseColor);
    });

    const translate = geometryFolder.addFolder('Translate');
    translate.add(options, 'translateX', -500, 500, 1).onChange(update);
    translate.add(options, 'translateY', -500, 500, 1).onChange(update);
    translate.add(options, 'translateZ', -2000, 1, 1).onChange(update);
    translate.open();

    const rotate = geometryFolder.addFolder('Rotate');
    rotate.add(options, 'rotateX', -Math.PI, Math.PI, 0.05).onChange(update);
    rotate.add(options, 'rotateY', -Math.PI, Math.PI, 0.05).onChange(update);
    rotate.add(options, 'rotateZ', -Math.PI, Math.PI, 0.05).onChange(update);
    rotate.open();

    const scale = geometryFolder.addFolder('Scale');
    scale.add(options, 'scaleX', 0, 5, 0.1).onChange(update);
    scale.add(options, 'scaleY', 0, 5, 0.1).onChange(update);
    scale.add(options, 'scaleZ', 0, 5, 0.1).onChange(update);
    scale.open();

    const shear = geometryFolder.addFolder('Shear');
    shear.add(options, 'shearXY', -3, 3, 0.1).onChange(update);
    shear.add(options, 'shearYX', -3, 3, 0.1).onChange(update);
    shear.add(options, 'shearXZ', -3, 3, 0.1).onChange(update);
    shear.add(options, 'shearZX', -3, 3, 0.1).onChange(update);
    shear.add(options, 'shearYZ', -3, 3, 0.1).onChange(update);
    shear.add(options, 'shearZY', -3, 3, 0.1).onChange(update);

    const reflect = geometryFolder.addFolder('Reflect');
    reflect.add(options, 'reflectX').onChange(update);
    reflect.add(options, 'reflectY').onChange(update);
    reflect.add(options, 'reflectZ').onChange(update);
}