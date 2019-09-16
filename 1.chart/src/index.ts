import 'normalize.scss/normalize.scss';
import './index.scss';
import App from './app';

const root: HTMLElement = document.querySelector('.app');

new App(root, func);

function func(x: number): number {
    return Math.sin(x * x);

    //return (0.1 + 0.3 * x * x * x) / (5 + Math.sqrt(0.15 + x * x * x * x));
}