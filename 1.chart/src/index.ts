import 'normalize.scss/normalize.scss';
import './index.scss';
import App from './app';

const root: HTMLElement = document.querySelector('.app');

new App(root, func);

function func(x: number): number {
    return Math.sin(x);
}