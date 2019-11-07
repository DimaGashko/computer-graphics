
export default class Texture {  
    readonly texture: WebGLTexture;

    private _defColor = [180, 180, 180, 255];
    private _isLoad = false;

    constructor(private _gl: WebGLRenderingContext, readonly src: string) { 
        this.texture = _gl.createTexture();
        _gl.bindTexture(_gl.TEXTURE_2D, this.texture);
        _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, 1, 1, 0, _gl.RGBA, _gl.UNSIGNED_BYTE,
            new Uint8Array(this._defColor));
    }

    public async load() { 
        if (this._isLoad) return;
        const gl = this._gl;

        const img = await this.loadImg(this.src);

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);

        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    loadImg(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve(img);
            img.onerror = reject;

            img.src = src;
        });
    }

    get loaded() { 
        return this._isLoad;
    }
}