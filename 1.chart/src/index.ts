import 'normalize.scss/normalize.scss';
import './index.scss';

class Test {
    constructor(private name = 'Test 1') { 

    }

    testBro() { 
        console.log(`Bro, it's ${this.name}`);
    }
}

new Test('Test 1').testBro();