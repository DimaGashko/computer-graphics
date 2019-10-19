
export default class FpsCorrection { 
    public val = 1;
    
    private baseFrameTime = 16;
    private prevTime = 0;

    start() { 
        this.prevTime = performance.now();
        return this;
    }

    update() { 
        const time = performance.now();
        this.val = (time - this.prevTime) / this.baseFrameTime;

        this.prevTime = time;
    }
}