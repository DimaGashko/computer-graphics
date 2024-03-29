import 'normalize.scss/normalize.scss';
import './index.scss';

import { throttle } from 'throttle-debounce';
import hexToRgba = require("hex-to-rgba");
import Hammer from 'hammerjs';
import * as dat from 'dat.gui';

import _font from './font';
import Vector from './scripts/Vector';
import matrixMulMatrix from './scripts/matrix/matrixMulMatrix';
import matrix3x3MulVec from './scripts/matrix/matrix3x3MulVec';

import { scale, translate, reflection, rotate, shear } from './affine';

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
$.tCenter = $.root.querySelector('.app__t-center');

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
    text: 'DA5',
    letterSpacing: 0.8,
    worldZoom: 3,

    translateX: 0,
    translateY: 0,
    zoomX: 1,
    zoomY: 1,
    shearX: 0,
    shearY: 0,
    deg: 0,
    reflectX: false,
    reflectY: false,

    tCenterX: 0,
    tCenterY: 0,

    fill: false,
    fillColor: '#f00',
    border: false,
    box: false,
    boundingBox: false,

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
];

let prevTMatrix: number[][];
let prevCoords = coords.copy();
let prevWorldZoom = options.worldZoom;

let charStart = 0;
let maxLen = 25;

let boundingBox = [
    new Vector(Infinity, Infinity),
    new Vector(-Infinity, -Infinity),
];

let starts: Vector[] = [];

(<any>window).set = (m: number[][]) => {
    tMatrix = m;
}

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

    clear();
    draw();
    moveTCenter();

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

    $.root.addEventListener('keydown', ({ keyCode }) => {
        pressedKeys[keyCode] = true;
    });

    $.root.addEventListener('keyup', ({ keyCode }) => {
        pressedKeys[keyCode] = false;
    });

    window.addEventListener('resize', throttle(50, () => {
        resize();
    }));

    window.addEventListener('load', () => {
        resize();
    });

    initTCenterEvents();
}

function initTCenterEvents() {
    const hammer = new Hammer($.tCenter);
    hammer.get('pinch').set({ enable: true });

    hammer.on('pan panstart', ({ center }) => {
        const pos = toWorld(new Vector(center.x, center.y));

        options.tCenterX = pos.x;
        options.tCenterY = pos.y;
    });
}

function updateTMatrix() {
    const rawTMatrixes = [
        translate(options.translateX, options.translateY),
        reflection(options.reflectX, options.reflectY),
        shear(options.shearX, options.shearY),
        scale(options.zoomX, options.zoomY),
        rotate(options.deg),
    ];

    tMatrix = rawTMatrixes.reduceRight((prev, cur) => {
        return matrixMulMatrix(prev, cur);
    });

    (<any>window).tm = tMatrix;
}

function draw() {
    const text = options.text.slice(0, maxLen).toUpperCase();
    const textPixels = getTextPixel(text);

    const [begin, end] = boundingBox;

    if (options.border) {
        if (begin.x < 0 || begin.y < 0 || end.x > screenSize.x || end.y > screenSize.y) {
            tMatrix = prevTMatrix;
            coords = prevCoords.copy();
            options.worldZoom = prevWorldZoom;

            clear();
            draw();
            return;
        }
    }

    textPixels.forEach(c => c.map((p) => drawPixel(p)));

    const z = options.worldZoom;

    if (options.fill) {
        fillRecursive(starts);
    }

    drawAllGrids();

    if (options.boundingBox) drawBoundingBox();

    clear();
    if (options.box) drawBox();

    prevTMatrix = tMatrix;
    prevCoords = coords.copy();
    prevWorldZoom = options.worldZoom;
}

function getTextPixel(text: string) {
    return text.split('').map((realChar) => {
        const char = (charMap.has(realChar))
            ? charMap.get(realChar) : font.unknown;

        const pixels = getPixelsOfCharacter(char);
        drawLetterSpace();

        return pixels;
    });
}

function drawLetterSpace() {
    charStart += font.size * options.letterSpacing;
}

function getPixelsOfCharacter(char: Char) {
    const z = options.worldZoom;
    const firstInside = new Vector(char[0][0], char[0][1]).add(new Vector(z / 2 + 1, z + 1));
    starts.push(toView(transformPoint(firstInside)));

    return char.map(transformLine).map(([x1, y1, x2, y2]) => {
        const a = toView(new Vector(x1, y1));
        const b = toView(new Vector(x2, y2));

        return [a.x, a.y, b.x, b.y];
    }).map(l => l.map(p => Math.round(p))).map((l) => {
        let [x1, y1, x2, y2] = l.slice();

        if (x1 > x2) [x1, x2] = [x2, x1];
        if (y1 > y2) [y1, y2] = [y2, y1];

        if (x1 < boundingBox[0].x) boundingBox[0].x = x1;
        if (y1 < boundingBox[0].y) boundingBox[0].y = y1;
        if (x2 > boundingBox[1].x) boundingBox[1].x = x2;
        if (y2 > boundingBox[1].y) boundingBox[1].y = y2;

        return getLinePixels(l[0], l[1], l[2], l[3]);
    }).reduce((pixels, line) => pixels.concat(line), []);
}

function getLinePixels(x1: number, y1: number, x2: number, y2: number): Vector[] {
    const z = Math.max((options.worldZoom / 2) ^ 0, 1);
    const pixels = [];

    const incX = Math.sign(x2 - x1) * z;
    const incY = Math.sign(y2 - y1) * z;

    const dx = Math.abs(x2 - x1) / z;
    const dy = Math.abs(y2 - y1) / z;
    const d = Math.max(dx, dy);

    let x = x1;
    let y = y1;

    let xErr = 0;
    let yErr = 0;

    pixels.push(new Vector(x, y));

    for (let i = 0; i <= d; i++) {
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

        pixels.push(new Vector(x, y));
    }

    return pixels;
}

function drawPixel({ x, y }: Vector) {
    const z = options.worldZoom;

    if (x < 0 || y < 0 || x > screenSize.x || y > screenSize.y) {
        return;
    }

    ctx.fillRect(x, y, z, z);
}

function drawBox() {
    const [a, b] = getBox();

    const points: [number, number][] = [
        [a.x, a.y],
        [a.x, b.y],
        [b.x, b.y],
        [b.x, a.y],
    ].map(([x, y]) => {
        const point = transformPoint(new Vector(x, y));
        ({ x, y } = toView(point));
        return [x, y];
    });

    ctx.save();
    ctx.lineWidth = Math.ceil(options.worldZoom / 2);

    ctx.beginPath();

    ctx.moveTo(...points[0]);
    points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));

    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

function drawBoundingBox() {
    const [a, b] = boundingBox;

    const points: [number, number][] = [
        [a.x, a.y],
        [a.x, b.y],
        [b.x, b.y],
        [b.x, a.y],
    ];

    ctx.save();
    ctx.lineWidth = Math.ceil(options.worldZoom / 2);

    ctx.beginPath();

    ctx.moveTo(...points[0]);
    points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));

    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

function fillRecursive(starts: Vector[]) {
    const d = ctx.getImageData(0, 0, screenSize.x, screenSize.y);
    const stack = starts.map(({ x, y }) => [x, y]);
    const { r, g, b } = hexToRawColor(options.fillColor);

    for (let i = 0; stack.length && i < 5e5; i++) {
        const [x, y] = stack.pop();

        if (x < 0 || y < 0 || x > screenSize.x || y > screenSize.y) continue;

        if (getPixel(d, x, y)[3] !== 0) {
            continue;
        }

        setPixel(d, x, y, [r ,g, b, 255]);

        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
    }

    ctx.putImageData(d, 0, 0);
}

function getPixel({ data, width }: ImageData, x: number, y: number) {
    const i = (width * Math.round(y) + Math.round(x)) * 4;

    return [
        data[i],
        data[i + 1],
        data[i + 2],
        data[i + 3],
    ]
}

function setPixel({ data, width }: ImageData, x: number, y: number, [r, g, b, a]: number[]) {
    if (x < 0 || y < 0) return;

    const i = (width * Math.round(y) + Math.round(x)) * 4;

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
}

function getBox(): [Vector, Vector] {
    const len = Math.min(options.text.length, maxLen);
    const one = font.size;
    const spacing = options.letterSpacing;

    return [
        new Vector(0, 0),
        new Vector(one + one * spacing * (len - 1), one * 1.08),
    ];
}

function transformLine([x1, y1, x2, y2]: Line): Line {
    const begin = transformPoint(new Vector(x1, y1));
    const end = transformPoint(new Vector(x2, y2));

    return [begin.x, begin.y, end.x, end.y];
}

function transformPoint(point: Vector) {
    point = point.copy();

    point.x += charStart - options.tCenterX;
    point.y -= options.tCenterY;

    point.set(matrix3x3MulVec(tMatrix, [point.x, point.y, 1]));

    point.x += options.tCenterX;
    point.y += options.tCenterY;

    return point;
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

    const type = (document.activeElement === $.tCenter)
        ? 'tCenter' : 'coords';

    const targ = (type === 'coords')
        ? coords : new Vector(options.tCenterX, options.tCenterY);

    if (pressedKeys[KEYS['left']]) targ.x -= step;
    if (pressedKeys[KEYS['top']]) targ.y -= step;
    if (pressedKeys[KEYS['right']]) targ.x += step;
    if (pressedKeys[KEYS['bottom']]) targ.y += step;

    if (type === 'coords') {
        coords = targ;
    } else {
        options.tCenterX = targ.x;
        options.tCenterY = targ.y;
    }
}

function moveTCenter() {
    const pos = toView(new Vector(options.tCenterX, options.tCenterY));
    $.tCenter.style.left = `${pos.x}px`;
    $.tCenter.style.top = `${pos.y}px`;
}

function initStyles() {
    ctx.fillStyle = options.color;
    ctx.strokeStyle = options.color;
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

function clear() {
    charStart = 0;

    boundingBox = [
        new Vector(Infinity, Infinity),
        new Vector(-Infinity, -Infinity),
    ];

    starts = [];
}

function font2CharMap(font: Font) {
    const map: Map<string, Char> = new Map();

    font.chars.forEach((charConfig) => {
        map.set(charConfig.symbol, charConfig.lines);
    });

    return map;
}

function hexToRawColor(hex: string) {
    const [r, g, b, a] = hexToRgba(hex).split(', ')
        .map(c => +c.replace(/\D+/g, ''));

    return { r, g, b, a: (a * 255) ^ 0 };
}

function initGui() {
    const setup = gui.addFolder('Setup');
    setup.addColor(options, 'color');
    setup.add(options, 'text');
    setup.add(options, 'resetWorldCoords');
    setup.open();

    const base = gui.addFolder('Main Transformations');
    base.add(options, 'worldZoom', 0.05, 50, 0.05)
    base.add(options, 'zoomX', 0.3, 3, 0.1).onChange(updateTMatrix);
    base.add(options, 'zoomY', 0.3, 3, 0.1).onChange(updateTMatrix);
    base.add(options, 'deg', 0, Math.PI * 2, 0.01).onChange(updateTMatrix);
    base.open();

    const additional = gui.addFolder('Additional Transformations');
    additional.add(options, 'translateX', -500, 500, 1).onChange(updateTMatrix);
    additional.add(options, 'translateY', -500, 500, 1).onChange(updateTMatrix);
    additional.add(options, 'shearX', -3, 3, 0.1).onChange(updateTMatrix);
    additional.add(options, 'shearY', -3, 3, 0.1).onChange(updateTMatrix);
    additional.add(options, 'reflectX').onChange(updateTMatrix);
    additional.add(options, 'reflectY').onChange(updateTMatrix);

    const tCenter = gui.addFolder('Transformation Center');
    tCenter.add(options, 'tCenterX', -500, 500, 0.1);
    tCenter.add(options, 'tCenterY', -500, 500, 0.1);

    const other = gui.addFolder('Other');
    other.add(options, 'letterSpacing', 0.5, 2.5, 0.1);
    other.add(options, 'fill');
    other.addColor(options, 'fillColor');
    other.add(options, 'border');
    other.add(options, 'box');
    other.add(options, 'boundingBox');
}
