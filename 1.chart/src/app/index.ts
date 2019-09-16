import { throttle } from 'throttle-debounce';
import Vector from '../scripts/Vector';

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
    private zoom = new Vector(50, 25);

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
        const offset = this.size.copy().div(new Vector(2, 2));
        return coords.copy().sub(offset).div(this.zoom).add(this.coords);
    }

    /**
     * Convert world coords to viewport coords
     * @param coords world coordinates
     */
    private toView(coords: Vector) {
        const offset = this.size.copy().div(new Vector(2, 2));
        return coords.copy().sub(this.coords).mul(this.zoom).add(offset);
    }

    private xToWorld(x: number) { return this.toWorld(new Vector(x, 0)).x; }
    private yToWorld(y: number) { return this.toWorld(new Vector(0, y)).y; }
    private xToView(x: number) { return this.toView(new Vector(x, 0)).x; }
    private yToView(y: number) { return this.toView(new Vector(0, y)).y; }

    private initEvents() {
        window.addEventListener('resize', throttle(100, () => {
            this.resize();
        }));
    }

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