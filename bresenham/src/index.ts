import 'normalize.scss/normalize.scss';
import './index.scss';

import { throttle } from 'throttle-debounce';
import Hammer from 'hammerjs';
import * as dat from 'dat.gui';

import font from './font';

console.log(font);

type Line = [number, number, number, number];
type Char = Line[];

interface Font { 
    chars: { 
        symbol: string,
        lines: Char,
    } [];
}

const $: {
    canvas?: HTMLCanvasElement,
    [type: string]: HTMLElement
} = {};

$.root = document.querySelector('.app');
$.canvas = $.root.querySelector('.app__canvas');

const ctx = $.canvas.getContext('2d');
const gui = new dat.GUI();

const pressedKeys: { [keycode: string]: boolean } = {}

const charMap = font2CharMap(font);
console.log(charMap);

const KEYS = {
    left: 37,
    top: 38,
    right: 39,
    bottom: 40,
}

const options = {
    color: '#c00',
    pixelSize: 10,
    text: 'Hello, World',
    toCenter: () => {
        coords.x = initialCoords.x;
        coords.y = initialCoords.y;
    }
}

let initialCoords = {
    x: 50,
    y: 200,
}

let coords = {
    x: initialCoords.x,
    y: initialCoords.y,
}

let width = 0;
let height = 0;

const unknown: Char = [
    [2, 0, 13, 0],
    [2, 0, 2, 15],
    [13, 0, 13, 15],
    [2, 15, 14, 15],
];

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
    updateCoords();
    useKeys();

    drawText(options.text);

    ctx.restore();
}

function initEvents() {
    const hammer = new Hammer($.canvas);
    hammer.get('pinch').set({ enable: true });

    let startCoords;

    hammer.on('pan panstart', ({ deltaX, deltaY, type }) => {
        if (type === 'panstart') {
            startCoords = {
                x: coords.x,
                y: coords.y,
            }
        }

        coords.x = startCoords.x + deltaX;
        coords.y = startCoords.y + deltaY;
    });

    $.canvas.addEventListener('keydown', ({ keyCode }) => {
        pressedKeys[keyCode] = true;
    });

    $.canvas.addEventListener('keyup', ({ keyCode }) => {
        pressedKeys[keyCode] = false;
    });

    window.addEventListener('resize', throttle(100, () => {
        resize();
    }));
}

function drawText(text) {
    text.split()
    drawCharacter(unknown);
}

function drawCharacter(char: Char) { 
    char.forEach((l) => {
        drawLine(l[0], l[1], l[2], l[3]);
    });
}

function drawLine(x1: number, y1: number, x2: number, y2: number) {
    const incX = Math.sign(x2 - x1);
    const incY = Math.sign(y2 - y1);

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);

    const d = (dx > dy) ? dx : dy;

    let x = x1;
    let y = y1;

    let xErr = 0;
    let yErr = 0;

    drawPixel(x, y);

    for (let i = 0; i < d; i++) {
        xErr += dx;
        yErr += dy;

        if (xErr > d) {
            xErr -= d;
            x += incX;
        }

        if (yErr > d) {
            yErr -= d;
            y += incY;
        }

        drawPixel(x, y);
    }
}

function drawPixel(x, y) {
    const size = options.pixelSize;
    ctx.fillRect(x * size, y * size, size, size);
}

function useKeys() {
    const step = 8;

    if (pressedKeys[KEYS['left']]) coords.x -= step;
    if (pressedKeys[KEYS['top']]) coords.y -= step;
    if (pressedKeys[KEYS['right']]) coords.x += step;
    if (pressedKeys[KEYS['bottom']]) coords.y += step;
}

function updateCoords() {
    ctx.translate(coords.x, coords.y);
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

function font2CharMap(font: Font) { 
    const map: Map<string, Char> = new Map();

    font.chars.forEach((cahrConfig) => { 
        map.set(cahrConfig.symbol, cahrConfig.lines);
    });

    return map;
}

function initGui() {
    const winW = window.innerWidth / 1.5;
    const winH = window.innerHeight / 1.5;

    gui.addColor(options, 'color');
    gui.add(options, 'pixelSize', 1, 25, 1);
    gui.add(options, 'text');
    gui.add(options, 'toCenter');
}