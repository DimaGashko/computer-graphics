import 'normalize.scss/normalize.scss';
import './index.scss';

import { compile } from 'mathjs';

import * as dat from 'dat.gui';
import App from './app/app';

const $root: HTMLElement = document.querySelector('.app');

const app = new App($root, (x) => {
    return Math.tan(x);
});

const tmp = {
    func: '2x * 3',
}

const gui = new dat.GUI();
const guiZoomX = gui.add(app, 'zoomX', 0.001, 100, 0.001);
const guiZoomY = gui.add(app, 'zoomY', 0.001, 100, 0.001);

const guiFunc = gui.add(tmp, 'func');

guiFunc.onChange((val) => {
    try {
        const func = compile(val);
        app.setFunc((x) => {
            const t = Date.now() / 1000;
            return func.evaluate({ x, t });
        });

    } catch {
        app.setFunc((x) => {
            return 0;
        });
    }
})

function func(x: number): number {
    return (0.1 + 0.3 * x * x * x) / (5 + Math.sqrt(0.15 + x * x * x * x));
}