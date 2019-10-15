import 'normalize.scss/normalize.scss';
import './index.scss';

import { throttle } from 'throttle-debounce';
import * as dat from 'dat.gui';

import vShaderSource from './shaders/v.glsl';
import fShaderSource from './shaders/f.glsl';
import Vector from '../src/scripts/Vector';
import { createShader, createProgram } from './scripts/webGlUtils';

import src1 from './assets/img.jpeg';
import src2 from './assets/img2.png';

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
    texCoord: gl.getAttribLocation(program, 'a_texCoord'),
    resolution: gl.getUniformLocation(program, 'resolution'),
    time: gl.getUniformLocation(program, 'time'),
    img: gl.getUniformLocation(program, 'image'),
    img2: gl.getUniformLocation(program, 'image2'),
}
const positionBuffer = gl.createBuffer();
const texCoordBuffer = createTexBuffer();
const tex2CoordBuffer = createTexBuffer();

let img: HTMLImageElement = null;
let img2: HTMLImageElement = null;
let tex: WebGLTexture = null;
let tex2: WebGLTexture = null;

loadImages([src1, src2]).then((images) => { 
    img = images[0];
    img2 = images[1];

    tex = createTexture(img);
    tex2 = createTexture(img2);

    initEvents();
    resize();
    start();
}).catch(e => { throw e });

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

    const ratio = img.width / img.height;
    setRectangle(gl, 0, 0, screenSize.y * ratio, screenSize.y);

    gl.enableVertexAttribArray(loc.texCoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(loc.texCoord, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1i(loc.img, 0);
    gl.uniform1i(loc.img2, 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex2);

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

function computeKernelWeight(kernel) {
    var weight = kernel.reduce(function (prev, curr) {
        return prev + curr;
    });

    return weight <= 0 ? 1 : weight;
}

function initGui() {

}

async function loadImages(sources: string[]) {
    const images = [];
    const promises = sources.map(async (src) => {
        images.push(await loadImg(src));
    });

    await Promise.all(promises);
    return images;
}

function createTexture(img: HTMLImageElement) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    return texture;
}

function createTexBuffer() {
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0]), gl.STATIC_DRAW);

    return buffer;
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

function loadImg(src: string) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = reject;

        img.src = src;
    });
}