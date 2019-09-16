import { throttle } from 'throttle-debounce';

interface IAppElements {
    canvas: HTMLCanvasElement,
    [type: string]: HTMLElement
}

interface IFunc { 
    (x: number): number
}

export default class App {
    private ctx: CanvasRenderingContext2D = null;

    private $: IAppElements = {
        canvas: null,
    };

    private animationFrameId = 0;

    private width = 0;
    private height = 0;

    constructor(private root: HTMLElement, private func: IFunc) {
        this.init();
        this.initEvents();
    }

    init() {
        this.getElements();
        this.resize();

        this.start();
    }

    start() {
        if (this.animationFrameId) return;

        this.animationFrameId = requestAnimationFrame(function tik() {
            this.clearCanvas();
            this.tik();
            requestAnimationFrame(tik.bind(this));
        }.bind(this));
    }

    stop() { 
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = 0;
    }

    tik() { 
        const w = this.width / 2;
        const h = this.height / 2;
        const t = Date.now() / 200;
        const x = (t % w) * Math.cos(t) + w
        const y = (t % h) * Math.sin(t) + h;

        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(x, y, 16, 16);
    }

    initEvents() {
        window.addEventListener('resize', throttle(100, () => {
            this.resize();
        }));
    }

    resize() {
        this.updateMetrics();
        this.updateCanvasSize();
    }

    updateMetrics() {
        this.width = this.root.offsetWidth;
        this.height = this.root.offsetHeight;
    }

    updateCanvasSize() {
        this.$.canvas.width = this.width;
        this.$.canvas.height = this.height;
    }

    clearCanvas() { 
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    getElements() {
        this.$.canvas = this.root.querySelector('.app__canvas');
        this.ctx = this.$.canvas.getContext('2d');
    }
}