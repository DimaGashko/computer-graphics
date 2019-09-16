import { throttle } from 'throttle-debounce';
import Vector from '../scripts/Vector';

import Hammer from 'hammerjs';

interface IAppElements {
    canvas?: HTMLCanvasElement,
    [type: string]: HTMLElement
}

interface IFunc {
    (x: number): number
}

export default class App {
    private ctx: CanvasRenderingContext2D = null;
    private $: IAppElements = {};

    private animationFrameId = 0;

    private size = new Vector(0, 0);
    private coords = new Vector(0, 0);
    private zoom = new Vector(10, 10);

    private pointsInterval = 1;

    constructor(private root: HTMLElement, private func: IFunc) {
        this.init();
        this.initEvents();
    }

    private init() {
        this.getElements();
        this.resize();

        this.start();
    }

    private initEvents() {
        const hammer = new Hammer(this.$.canvas);
        hammer.get('pinch').set({ enable: true });

        let startCoords;

        hammer.on('pan panstart', ({ deltaX, deltaY, type }) => {
            if (type === 'panstart') {
                startCoords = this.coords.copy();
            }

            const delta = new Vector(-deltaX, deltaY).div(this.zoom);
            this.coords = startCoords.copy().add(delta);
        });

        window.addEventListener('mousewheel', (e: MouseWheelEvent) => {
            this.zoom.y += e.deltaY / 5; 

            if (e.shiftKey) {
                this.zoom.x += e.deltaX / 5;
            } else {
                this.zoom.x += e.deltaY / 5;
            }
        })

        hammer.on('pinch', (e) => { 
            console.log(e);
        })

        window.addEventListener('resize', throttle(100, () => {
            this.resize();
        }));
    }

    public setZoom(zoom) { 
        zoom = Math.max(zoom, 1e-10);
        zoom = Math.min(zoom, 1e10);

        this.zoom = new Vector(zoom, zoom);
    }

    start() {
        if (this.animationFrameId) return;
        const app = this;

        this.animationFrameId = requestAnimationFrame(function tik() {
            app.clearCanvas();
            app.tik();
            requestAnimationFrame(tik);
        });
    }

    stop() {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = 0;
    }

    private tik() {
        this.renderFunc();
    }

    private renderFunc() {
        const ctx = this.ctx;
        ctx.save();

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;

        ctx.beginPath();

        this.getPoints().forEach((point, i) => {
            const type = (i === 0) ? 'moveTo' : 'lineTo';
            ctx[type](point.x, point.y);
        });

        ctx.stroke();
        ctx.restore();
    }

    private getPoints() {
        const interval = this.pointsInterval;
        const steps = Math.ceil(this.size.x / interval) + 1;

        const xs = new Array(steps).fill(0).map((_, i) => i * interval);
        const ys = xs.map(x => this.xToWorld(x))
            .map(x => this.func(x))
            .map(y => this.yToView(y));

        return xs.map((x, i) => new Vector(x, ys[i]));
    }
    /**
     * Convert viewport coords to world coords
     * @param coords viport coordinates
     */
    private toWorld(coords: Vector) {
        return coords.copy()
            .sub(this.size.copy().div(new Vector(2, 2)))
            .mul(new Vector(1, -1))
            .div(this.zoom)
            .add(this.coords);
    }

    /**
     * Convert world coords to viewport coords
     * @param coords world coordinates
     */
    private toView(coords: Vector) {
        return coords.copy()
            .sub(this.coords)
            .mul(this.zoom)
            .mul(new Vector(1, -1))
            .add(this.size.copy().div(new Vector(2, 2)));
    }

    private xToWorld(x: number) { return this.toWorld(new Vector(x, 0)).x; }
    private yToWorld(y: number) { return this.toWorld(new Vector(0, y)).y; }
    private xToView(x: number) { return this.toView(new Vector(x, 0)).x; }
    private yToView(y: number) { return this.toView(new Vector(0, y)).y; }

    private resize() {
        this.updateMetrics();
        this.updateCanvasSize();
    }

    private updateMetrics() {
        this.size.x = this.root.offsetWidth;
        this.size.y = this.root.offsetHeight;
    }

    private updateCanvasSize() {
        this.$.canvas.width = this.size.x;
        this.$.canvas.height = this.size.y;
    }

    private clearCanvas() {
        this.ctx.clearRect(0, 0, this.size.x, this.size.y);
    }

    private getElements() {
        this.$.canvas = this.root.querySelector('.app__canvas');
        this.ctx = this.$.canvas.getContext('2d');
    }
}