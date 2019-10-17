import 'normalize.scss/normalize.scss';
import './index.scss';

import { throttle } from 'throttle-debounce';
import * as dat from 'dat.gui';

import vShaderSource from './shaders/v.glsl';
import fShaderSource from './shaders/f.glsl';
import Vector from '../src/scripts/Vector';
import { createShader, createProgram } from './scripts/webGlUtils';
import { identity } from './affine';
import f from './geometries/f';

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

    translateX: 0,
    translateY: 0,
    translateZ: 0,

    scaleX: 0,
    scaleY: 0,
    scaleZ: 0,

    shearX: 0,
    shearY: 0,
    shearZ: 0,

    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,

    reflectX: 0,
    reflectY: 0,
    reflectZ: 0,
}

const affine = identity();

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

}

function initGui() {
    const baseOptions = gui.addFolder('Base Options');
    baseOptions.addColor(options, 'color');

    const translate = gui.addFolder('Translate');
    translate.add(options, 'translateX').onChange(updateAffine);
    translate.add(options, 'translateY').onChange(updateAffine);
    translate.add(options, 'translateZ').onChange(updateAffine);
    translate.open();

    const rotate = gui.addFolder('Rotate');
    rotate.add(options, 'rotateX').onChange(updateAffine);
    rotate.add(options, 'rotateY').onChange(updateAffine);
    rotate.add(options, 'rotateZ').onChange(updateAffine);
    rotate.open();

    const scale = gui.addFolder('Scale');
    scale.add(options, 'scaleX').onChange(updateAffine);
    scale.add(options, 'scaleY').onChange(updateAffine);
    scale.add(options, 'scaleZ').onChange(updateAffine);
    scale.open();

    const shear = gui.addFolder('Shear');
    shear.add(options, 'shearX').onChange(updateAffine);
    shear.add(options, 'shearY').onChange(updateAffine);
    shear.add(options, 'shearZ').onChange(updateAffine);

    const reflect = gui.addFolder('Reflect');
    reflect.add(options, 'reflectX').onChange(updateAffine);
    reflect.add(options, 'reflectY').onChange(updateAffine);
    reflect.add(options, 'reflectZ').onChange(updateAffine); 
}