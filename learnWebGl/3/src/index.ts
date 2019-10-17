import 'normalize.scss/normalize.scss';
import './index.scss';

import { throttle } from 'throttle-debounce';
import * as dat from 'dat.gui';

import vShaderSource from './shaders/v.glsl';
import fShaderSource from './shaders/f.glsl';
import Vector from '../src/scripts/Vector';
import { createShader, createProgram } from './scripts/webGlUtils';

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

}

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
    gl.vertexAttribPointer(loc.aPosition, 2, gl.FLOAT, false, 0, 0);

    setRectangle(gl, 0, 0, screenSize.x, screenSize.y);

    gl.uniform2f(loc.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(loc.time, performance.now() / 1000);

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

function initGui() {

}

function setRectangle(gl, x, y, width, height) {
    const x1 = x;
    const x2 = x + width;
    const y1 = y;
    const y2 = y + height;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
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