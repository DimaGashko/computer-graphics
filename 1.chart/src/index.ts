import 'normalize.scss/normalize.scss';
import './index.scss';

import * as dat from 'dat.gui';
import App from './app/app';

const tmp = {
    func: '(0.1 + 0.3 * x * x * x) / (5 + Math.sqrt(0.15 + x * x * x * x))',
};

const app = new App(document.querySelector('.app'), createFunc(tmp.func));

const gui = new dat.GUI();

const guiFunc = gui.add(tmp, 'func');

guiFunc.onChange(async (val) => {
    try {
        const func = createFunc(val);

        app.setFunc((x) => {
            return func(x, performance.now() / 10000);
        });

    } catch {
        app.setFunc((x) => {
            return 0;
        });
    }
});

function createFunc(str) { 
    return <(x, y?: number) => number>new Function('x, t', `
        try {
            return ${str};
        } catch {
            return 0;
        }
    `);
}