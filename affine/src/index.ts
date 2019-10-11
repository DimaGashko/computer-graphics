import 'normalize.scss/normalize.scss';
import './index.scss';

import { throttle } from 'throttle-debounce';
import Hammer from 'hammerjs';
import * as dat from 'dat.gui';

import _font from './font';
import Vector from './scripts/Vector';
import { scale, translate } from './affine';
import matrixMulMatrix from './scripts/matrixMulMatrix';
import matrixMulVec from './scripts/matrixMulVec';
import copyMatrix from './scripts/copyMatrix';

type Line = [number, number, number, number];
type Char = Line[];

interface Font {
    size: number,
    chars: {
        symbol: string,
        lines: Char,
    }[],
    unknown: Char,
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

const font: Font = _font;
const charMap = font2CharMap(font);

const KEYS = {
    left: 37,
    top: 38,
    right: 39,
    bottom: 40,
}

const options = {
    color: '#0f0',
    text: 'A5',
    letterSpacing: 0.8,
    worldZoom: 3,
    zoomX: 1,
    zoomY: 1,
    resetWorldCoords: () => {
        coords = initialCoords.copy();
    }
}

const screenSize = new Vector(0, 0);
const initialCoords = new Vector(50, 50);
let coords = initialCoords.copy();

let tMatrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
]

let curTMatrix: number[][] = null;

resize();
updateTMatrix();
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
    useKeyboard();

    curTMatrix = copyMatrix(tMatrix);

    drawAllGrids();
    draw();

    ctx.restore();
}

function initEvents() {
    const hammer = new Hammer($.canvas);
    hammer.get('pinch').set({ enable: true });

    let startCoords: Vector;

    hammer.on('pan panstart', ({ deltaX, deltaY, type }) => {
        if (type === 'panstart') {
            startCoords = coords.copy();
        }

        const z = new Vector(options.worldZoom, options.worldZoom);
        const delta = new Vector(-deltaX, -deltaY).div(z);

        coords = startCoords.copy().add(delta);
    });

    $.canvas.addEventListener('mousewheel', throttle(16, (e: MouseWheelEvent) => {
        const cur = options.worldZoom;
        const delta = -e.deltaY * cur / 1000;

        options.worldZoom = Math.min(Math.max(cur + delta, 0.05), 50);
    }));

    $.canvas.addEventListener('keydown', ({ keyCode }) => {
        pressedKeys[keyCode] = true;
    });

    $.canvas.addEventListener('keyup', ({ keyCode }) => {
        pressedKeys[keyCode] = false;
    });

    window.addEventListener('resize', throttle(50, () => {
        resize();
    }));

    window.addEventListener('load', () => {
        resize();
    });
}

function draw() {
    drawText(options.text.toUpperCase());
}

function drawText(text: string) {
    text.split('').forEach((realChar) => {
        const char = (charMap.has(realChar))
            ? charMap.get(realChar) : font.unknown;

        drawCharacter(char);
        drawLetterSpace();
    });
}

function drawLetterSpace() {
    const translateMatrix = translate(font.size * options.letterSpacing, 0);
    curTMatrix = matrixMulMatrix(curTMatrix, translateMatrix);
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

function updateTMatrix() {
    const rawTMatrixes = [
        scale(options.zoomX, options.zoomY)
    ];

    tMatrix = rawTMatrixes.reduceRight((prev, cur) => {
        return matrixMulMatrix(prev, cur);
    });

    (<any>window).tm = tMatrix;
}

function drawPixel(x: number, y: number) {
    const z = options.worldZoom;

    [x, y] = matrixMulVec(curTMatrix, [x, y, 1]);
    ({ x, y } = toView(new Vector(x, y)));

    ctx.fillRect(x, y, z, z);
}

function drawAllGrids() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.2)';

    if (options.worldZoom >= 9) {
        ctx.lineWidth = 1;
        drawGrid(new Vector(1, 1));
    }

    if (options.worldZoom >= 3) {
        ctx.lineWidth = 1;
        drawGrid(new Vector(10, 10));
    }

    if (options.worldZoom >= 0.4) {
        ctx.lineWidth = 2;
        drawGrid(new Vector(50, 50));
    } else if (options.worldZoom >= 0.08) {
        ctx.lineWidth = 1;
        drawGrid(new Vector(250, 250));
    }

    ctx.lineWidth = (options.worldZoom >= 0.4) ? 3 : 1;
    drawGrid(new Vector(1000, 1000));

    ctx.restore();
}

function drawGrid(interval: Vector) {
    const z = new Vector(options.worldZoom, options.worldZoom)
    const step = interval.copy().mul(z);
    const numberOfSteps = screenSize.copy().div(step);
    const g0 = toWorld(new Vector(-1, -1));
    const worldStart = g0.copy().sub(g0.mod(interval));
    const start = toView(worldStart);

    for (let i = 0; i < numberOfSteps.x; i++) {
        const x = Math.round(start.x + step.x * i);

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, screenSize.y);
        ctx.stroke();
    }

    for (let i = 0; i < numberOfSteps.y; i++) {
        const y = Math.round(start.y + step.y * i);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(screenSize.x, y);
        ctx.stroke();
    }
}

/**
 * Convert viewport coords to world coords
 * @param coords viport coordinates
 */
function toWorld(targetCoords: Vector) {
    return targetCoords.copy()
        .sub(screenSize.copy().div(new Vector(2, 2)))
        .div(new Vector(options.worldZoom, options.worldZoom))
        .add(coords);
}

/**
 * Convert world coords to viewport coords
 * @param targetCoords world coordinates
 */
function toView(targetCoords: Vector) {
    return targetCoords.copy()
        .sub(coords)
        .mul(new Vector(options.worldZoom, options.worldZoom))
        .add(screenSize.copy().div(new Vector(2, 2)));
}

function useKeyboard() {
    const step = 8;

    if (pressedKeys[KEYS['left']]) coords.x -= step;
    if (pressedKeys[KEYS['top']]) coords.y -= step;
    if (pressedKeys[KEYS['right']]) coords.x += step;
    if (pressedKeys[KEYS['bottom']]) coords.y += step;
}

function initStyles() {
    ctx.fillStyle = options.color;
}

function resize() {
    updateMetrics();
    updateCanvasSize();
}

function updateMetrics() {
    screenSize.x = $.root.offsetWidth;
    screenSize.y = $.root.offsetHeight;
}

function updateCanvasSize() {
    $.canvas.width = screenSize.x;
    $.canvas.height = screenSize.y;
}

function clearCanvas() {
    ctx.clearRect(0, 0, screenSize.x, screenSize.y);
}

function font2CharMap(font: Font) {
    const map: Map<string, Char> = new Map();

    font.chars.forEach((charConfig) => {
        map.set(charConfig.symbol, charConfig.lines);
    });

    return map;
}

function initGui() {
    gui.addColor(options, 'color');
    gui.add(options, 'text');
    gui.add(options, 'zoomX', 0.1, 10, 0.1).onChange(() => updateTMatrix());
    gui.add(options, 'zoomY', 0.1, 10, 0.1).onChange(() => updateTMatrix());
    gui.add(options, 'worldZoom', 0.05, 50, 0.05)
    gui.add(options, 'letterSpacing', 0.5, 2.5, 0.1);
    gui.add(options, 'resetWorldCoords');
}