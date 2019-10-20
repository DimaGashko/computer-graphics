import 'normalize.scss/normalize.scss';
import './index.scss';

import vShaderSource from './shaders/v.glsl';
import fShaderSource from './shaders/f.glsl';

import { throttle } from 'throttle-debounce';
import * from 'fullscreen-api-polyfill';
import * as dat from 'dat.gui';

import { createShader, createProgram } from './scripts/webGlUtils';
import { hexToGlColor } from './scripts/utils';
import { makePerspective } from './scripts/affine';
import matMulMat4 from './scripts/math/matMulMat4';
import TMatrix from './scripts/TMatrix';

import FGeometry from './geometries/FGeometry/FGeometry';
import Geometry from './geometries/Geometry';
import GlGeometry from './geometries/GlGeometry';
import FpsCorrection from './scripts/FpsCorrection';

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
const fpsCorrection = new FpsCorrection().start();

const worldRadius = 2500;

const options = {
    baseColor: "#0b0",
    rotateSpeed: 0.01,

    fieldOfView: Math.PI / 3,
    far: worldRadius * 2,
    near: 1,

    activeGeometry: 'Geometry 1',
    baseGlColor: null,

    toggleFullscreen: () => toggleFullscreen(),
}

const camera = {
    translateX: 0,
    translateY: 0,
    translateZ: 1500,

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

let curMovementX = 0;
let curMovementY = 0;

let viewMatrix: TMatrix;

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
    options.translateZ = -offset - z * size * k;
});

initEvents();
resize();
initGui();
start();

function drawFrame() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    fpsCorrection.update();

    updateCamera();
    updateViewMatrix();

    geometries.forEach((glGeometry) => {
        const { verticesBuffer, colorsBuffer, geometry, options: gOptions } = glGeometry;

        gOptions.rotateY += options.rotateSpeed * fpsCorrection.val;

        updateTMatrix(glGeometry);

        gl.enableVertexAttribArray(loc.aPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.vertexAttribPointer(loc.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(loc.aColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
        gl.vertexAttribPointer(loc.aColor, 3, gl.UNSIGNED_BYTE, true, 0, 0);

        gl.uniformMatrix4fv(loc.tMatrix, false, geometry.tMatrix.matrix);
        gl.uniform1f(loc.time, performance.now() / 1000);

        let { r, g, b } = options.baseGlColor;
        gl.uniform4f(loc.baseColor, r, g, b, 1);

        gl.drawArrays(gl.TRIANGLES, 0, geometry.primitiveCount);
    });
}

function updateCamera() {
    camera.rotateY += curMovementX / 500;
    camera.rotateX -= curMovementY / 500;

    camera.rotateX = Math.min(Math.max(camera.rotateX, -Math.PI / 3), Math.PI / 3);

    curMovementX = 0;
    curMovementY = 0;
}

function updateViewMatrix() {
    const { fieldOfView, near, far } = options;
    const { translateX, translateY, translateZ, rotateX, rotateY, rotateZ } = camera;

    viewMatrix = new TMatrix()
        .translate(translateX, translateY, translateZ)
        .rotateY(rotateY)
        .rotateX(rotateX)
        .rotateZ(rotateZ)
        .inverse();

    viewMatrix.setTMatrix(matMulMat4(
        viewMatrix.matrix,
        makePerspective(fieldOfView, ratio, near, far)
    ));
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

    tMatrix.reset(viewMatrix.matrix)
        .translate(translateX, translateY, translateZ)
        .rotateY(rotateY)
        .rotateX(rotateX)
        .rotateZ(rotateZ)
        .scale(scaleX, scaleY, scaleZ)
        .reflect(reflectX, reflectY, reflectZ)
        .shear(shearXY, shearYX, shearXZ, shearZX, shearYZ, shearZY)
}

function start() {
    requestAnimationFrame(function tik() {
        drawFrame();
        requestAnimationFrame(tik);
    });
}

function initEvents() {
    window.addEventListener('resize', throttle(1000, () => {
        resize();
    }));

    window.addEventListener('load', () => {
        resize();
    });

    $.canvas.addEventListener('click', () => {
        lockPointer();
    });

    $.canvas.addEventListener('mousemove', ({ movementX, movementY }) => {
        curMovementX += movementX;
        curMovementY += movementY;
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === $.canvas) {
            $.root.classList.add('app--pointer-lock');
        } else {
            $.root.classList.remove('app--pointer-lock');
        }
    });
}

function resize() {
    updateMetrics();
    updateCanvasSize();
}

function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
        return;
    }

    try {
        document.body.requestFullscreen();
    } catch { };
}

function lockPointer() {
    if (document.pointerLockElement === $.canvas) return;
    $.canvas.requestPointerLock();
}

function unlockPointer() {
    if (document.pointerLockElement !== $.canvas) return;
    document.exitPointerLock();
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

function getActiveGeometryOptions() {
    const index = +options.activeGeometry.replace(/\D+/g, '') - 1;
    return geometries[index];
}

function initGui() {
    gui.domElement.classList.add('gui-root');

    const baseOptions = gui.addFolder('Base Options');
    const cameraFolder = gui.addFolder('Camera');
    const geometryFolder = gui.addFolder(`Geometry`);

    baseOptions.open();
    cameraFolder.open();
    geometryFolder.open();

    baseOptions.addColor(options, 'baseColor').onChange(() => {
        options.baseGlColor = hexToGlColor(options.baseColor);
    });

    baseOptions.add(options, 'toggleFullscreen');

    baseOptions.add(options, 'rotateSpeed', -0.1, 0.1, 0.001);
    baseOptions.add(options, 'fieldOfView', 0.3, Math.PI - 0.3, 0.01);

    cameraFolder.add(camera, 'translateX', -worldRadius, worldRadius);
    cameraFolder.add(camera, 'translateY', -worldRadius, worldRadius);
    cameraFolder.add(camera, 'translateZ', -worldRadius, worldRadius);

    cameraFolder.add(camera, 'rotateX', -Math.PI, Math.PI, 0.05);
    cameraFolder.add(camera, 'rotateY', -Math.PI, Math.PI, 0.05);
    cameraFolder.add(camera, 'rotateZ', -Math.PI, Math.PI, 0.05);

    initGeometryGui(geometryFolder);
}

function initGeometryGui(geometryFolder: dat.GUI) {
    const { options: gOptions } = getActiveGeometryOptions();

    geometryFolder.add(options, 'activeGeometry', geometries.map((_, i) => `Geometry ${i + 1}`)).onChange(() => {
        for (let key in geometryFolder.__folders) {
            geometryFolder.removeFolder(geometryFolder.__folders[key]);
        }

        initGeometryGui(geometryFolder);
    });

    const translate = geometryFolder.addFolder('Translate');
    translate.add(gOptions, 'translateX', -worldRadius * 0.95, worldRadius);
    translate.add(gOptions, 'translateY', -worldRadius * 0.95, worldRadius);
    translate.add(gOptions, 'translateZ', -worldRadius * 0.95, worldRadius);
    translate.open();

    const rotate = geometryFolder.addFolder('Rotate');
    rotate.add(gOptions, 'rotateX', -Math.PI, Math.PI, 0.05);
    rotate.add(gOptions, 'rotateY', -Math.PI, Math.PI, 0.05);
    rotate.add(gOptions, 'rotateZ', -Math.PI, Math.PI, 0.05);
    rotate.open();

    const scale = geometryFolder.addFolder('Scale');
    scale.add(gOptions, 'scaleX', 0, 6, 0.1);
    scale.add(gOptions, 'scaleY', 0, 6, 0.1);
    scale.add(gOptions, 'scaleZ', 0, 6, 0.1);
    scale.open();

    const shear = geometryFolder.addFolder('Shear');
    shear.add(gOptions, 'shearXY', -2, 2, 0.05);
    shear.add(gOptions, 'shearYX', -2, 2, 0.05);
    shear.add(gOptions, 'shearXZ', -2, 2, 0.05);
    shear.add(gOptions, 'shearZX', -2, 2, 0.05);
    shear.add(gOptions, 'shearYZ', -2, 2, 0.05);
    shear.add(gOptions, 'shearZY', -2, 2, 0.05);

    const reflect = geometryFolder.addFolder('Reflect');
    reflect.add(gOptions, 'reflectX');
    reflect.add(gOptions, 'reflectY');
    reflect.add(gOptions, 'reflectZ');
}