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
import CubeGeometry from './geometries/CubeGeometry/CubeGeometry';

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
    far: worldRadius * 2 * 3,
    near: 1,

    activeGeometry: 'Geometry 1',
    baseGlColor: null,

    toggleFullscreen: () => toggleFullscreen(),
}

const camera = {
    translateX: 0,
    translateY: -300,
    translateZ: 3500,

    rotateX: Math.PI / 9,
    rotateY: 0,
    rotateZ: 0,

    minX: -Math.PI / 2.2,
    maxX: Math.PI / 2.2,

    speed: 10,
    moveMode: 'keyboard',
}

const KEYS = {
    forward: 87,
    back: 83,
    right: 68,
    left: 65,
    up: 32,
    down: 16,
};

const pressedKeys: Map<string, boolean> = new Map();

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
    const size = 300;

    const offset = -(size * side) / 2;

    options.translateX = offset + x * size;
    options.translateY = -350 - y * size;
    options.translateZ = -offset - z * size;
});

geometries.push(...[
    [worldRadius, -500, worldRadius],
    [worldRadius, -500, -worldRadius],
    [-worldRadius, -500, worldRadius],
    [-worldRadius, -500, -worldRadius],
]
    .map(coords => coords.map(c => c * 0.8))
    .map(([x, y, z]) => {
        const glGeometry = new GlGeometry(gl, new FGeometry());

        glGeometry.options.translateX = x;
        glGeometry.options.translateY = y;
        glGeometry.options.translateZ = z;

        return glGeometry;
    })
);

(function () {
    const ground = new CubeGeometry();
    const glGeometry = new GlGeometry(gl, ground);
    const { options } = glGeometry;

    const side = worldRadius * 2 * 5;
    const size = 50;

    options.translateX = -side;
    options.translateY = 0;
    options.translateZ = -side;

    options.scaleY = 0.25;
    options.scaleX = side / size;
    options.scaleZ = side / size;

    options.autoRotate = false;

    geometries.push(glGeometry);
}());

options.baseGlColor = hexToGlColor(options.baseColor);

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

        if (gOptions.autoRotate) {
            gOptions.rotateY += options.rotateSpeed * fpsCorrection.val;
        }

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
    updateCameraAngle();

    if (camera.moveMode === 'auto') {
        updateCameraCoordsAuto();
    } else {
        updateCameraCoordsByKeyboard();
    }
}

function updateCameraAngle() {
    const { minX, maxX } = camera;

    camera.rotateY += curMovementX / 500;
    camera.rotateX -= curMovementY / 500;

    camera.rotateX = Math.min(Math.max(camera.rotateX, minX), maxX);

    curMovementX = 0;
    curMovementY = 0;
}

function updateCameraCoordsAuto() {
    const { speed, rotateX, rotateY } = camera;
    const d = speed * fpsCorrection.val;

    camera.translateZ -= d * Math.cos(rotateY);
    camera.translateY -= d * Math.sin(rotateX);
    camera.translateX += d * Math.sin(rotateY);
}

function updateCameraCoordsByKeyboard() {
    const { speed } = camera;
    const normalAngle = Math.PI / 2;
    const d = speed * fpsCorrection.val;

    let rotateX = 0;
    if (pressedKeys[KEYS.up]) rotateX += normalAngle;
    if (pressedKeys[KEYS.down]) rotateX -= normalAngle;
    camera.translateY -= d * Math.sin(rotateX);

    let y = 0;
    let z = 0;

    if (pressedKeys[KEYS.forward]) z++;
    if (pressedKeys[KEYS.back]) z--;

    if (pressedKeys[KEYS.left]) y--;
    if (pressedKeys[KEYS.right]) y++;

    if (y === 0 && z === 0) return;
    const rotateY = Math.atan2(y, z);

    const dx = d * Math.sin(rotateY);
    const dz = d * Math.cos(rotateY);

    camera.translateX += dx * Math.cos(-camera.rotateY) - dz * Math.sin(-camera.rotateY);
    camera.translateZ -= dx * Math.sin(-camera.rotateY) + dz * Math.cos(-camera.rotateY);
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

function updateTMatrix(glGeometry: GlGeometry) {
    const { geometry, options } = glGeometry;

    const tMatrix = geometry.tMatrix;

    const {
        reflectX, reflectY, reflectZ,
        rotateX, rotateY, rotateZ,
        scaleX, scaleY, scaleZ,
        shearXY, shearXZ, shearYX, shearYZ, shearZX, shearZY,
        translateX, translateY, translateZ,
    } = options;

    const { centerX, centerY, centerZ } = geometry;

    tMatrix.reset(viewMatrix.matrix)
        .translate(translateX, translateY, translateZ)
        .translate(centerX * scaleX, centerY * scaleY, centerZ * scaleZ)
        .rotateY(rotateY)
        .rotateX(rotateX)
        .rotateZ(rotateZ)
        .reflect(reflectX, reflectY, reflectZ)
        .scale(scaleX, scaleY, scaleZ)
        .translate(-centerX, -centerY, -centerZ)
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

    $.canvas.addEventListener('mousedown', () => {
        lockPointer();
    });

    $.canvas.addEventListener('mousemove', ({ movementX, movementY }) => {
        if (document.pointerLockElement !== $.canvas) return;
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

    document.addEventListener('keydown', ({ keyCode }) => {
        return pressedKeys[keyCode] = true
    });

    document.addEventListener('keyup', ({ keyCode }) => {
        return pressedKeys[keyCode] = false;
    });
}

function resize() {
    updateMetrics();
    updateCanvasSize();
}

function toggleFullscreen() {
    if (document.fullscreenElement !== $.root) {
        startFullscreen();
        return;
    }

    exitFullscreen()
}

function exitFullscreen() {
    if (document.fullscreenElement !== $.root) {
        return;
    }

    document.exitFullscreen();
}

function startFullscreen() {
    if (document.fullscreenElement === $.root) {
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

    ratio = canvasW / canvasH;
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

    cameraFolder.add(camera, 'speed', -25, 25);
    cameraFolder.add(camera, 'moveMode', ['keyboard', 'auto']);

    const tCameraFolder = cameraFolder.addFolder('Manual Transformations');
    tCameraFolder.add(camera, 'translateX', -worldRadius, worldRadius);
    tCameraFolder.add(camera, 'translateY', -worldRadius, worldRadius);
    tCameraFolder.add(camera, 'translateZ', -worldRadius, worldRadius);

    tCameraFolder.add(camera, 'rotateX', -Math.PI, Math.PI, 0.05);
    tCameraFolder.add(camera, 'rotateY', -Math.PI, Math.PI, 0.05);
    tCameraFolder.add(camera, 'rotateZ', -Math.PI, Math.PI, 0.05);


    initGeometryGui(geometryFolder);
}

function initGeometryGui(geometryFolder: dat.GUI) {
    const { options: gOptions } = getActiveGeometryOptions();

    geometryFolder.add(options, 'activeGeometry', geometries.map((_, i) => `Geometry ${i + 1}`)).onChange(() => {
        for (let key in geometryFolder.__folders) {
            geometryFolder.removeFolder(geometryFolder.__folders[key]);
        }

        for (let key in geometryFolder.__controllers) {
            geometryFolder.__controllers[key].remove();
        }

        initGeometryGui(geometryFolder);
    });

    const translate = geometryFolder.addFolder('Translate');
    translate.add(gOptions, 'translateX', -worldRadius * 0.8, worldRadius * 0.8);
    translate.add(gOptions, 'translateY', -worldRadius * 0.8, worldRadius * 0.8);
    translate.add(gOptions, 'translateZ', -worldRadius * 0.8, worldRadius * 0.8);
    translate.open();

    const rotate = geometryFolder.addFolder('Rotate');
    rotate.add(gOptions, 'autoRotate');
    rotate.add(gOptions, 'rotateX', -Math.PI, Math.PI, 0.05);
    rotate.add(gOptions, 'rotateY', -Math.PI, Math.PI, 0.05);
    rotate.add(gOptions, 'rotateZ', -Math.PI, Math.PI, 0.05);
    rotate.open();

    const scale = geometryFolder.addFolder('Scale');
    scale.add(gOptions, 'scaleX', 0.1, 6, 0.1);
    scale.add(gOptions, 'scaleY', 0.1, 6, 0.1);
    scale.add(gOptions, 'scaleZ', 0.1, 6, 0.1);
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