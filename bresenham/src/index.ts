import 'normalize.scss/normalize.scss';
import './index.scss';

import { throttle } from 'throttle-debounce';
import * as dat from 'dat.gui';

const $: {
    canvas?: HTMLCanvasElement,
    [type: string]: HTMLElement
} = {};

const options = {
    color: '#c00',
    pixelSize: 10,
    offsetX: 50,
    offsetY: 50,
}

$.root = document.querySelector('.app');
$.canvas = $.root.querySelector('.app__canvas');

const ctx = $.canvas.getContext('2d');
const gui = new dat.GUI();

let width = 0;
let height = 0;

resize();
start();
initGui();
initEvents();

function start() {
    requestAnimationFrame(function tik() {
        clearCanvas();
        drawFrame();

        requestAnimationFrame(tik);
    });
}

function drawFrame() {
    ctx.save();

    initStyles();
    useOffset();

    drawPixel(0, 0);
    drawPixel(0, 5);
    drawPixel(5, 0);
    drawPixel(5, 5);
    ctx.restore();
}

function initEvents() {
    window.addEventListener('resize', throttle(100, () => {
        resize();
    }));
}

function drawPixel(x, y) {
    const size = options.pixelSize;
    ctx.fillRect(x * size, y * size, size, size);
}

function useOffset() { 
    ctx.translate(options.offsetX, options.offsetY);
}

function initStyles() { 
    ctx.fillStyle = options.color;
}

function resize() {
    updateMetrics();
    updateCanvasSize();
}

function updateMetrics() {
    width = $.root.offsetWidth;
    height = $.root.offsetHeight;
}

function updateCanvasSize() {
    $.canvas.width = width;
    $.canvas.height = height;
}

function clearCanvas() {
    ctx.clearRect(0, 0, width, height);
}

function initGui() {
    const winW = window.innerWidth / 2;
    const winH = window.innerHeight / 2;

    gui.addColor(options, 'color');
    gui.add(options, 'pixelSize', 1, 25);
    gui.add(options, 'offsetX', -winW, winW);
    gui.add(options, 'offsetY', -winH, winH);
}