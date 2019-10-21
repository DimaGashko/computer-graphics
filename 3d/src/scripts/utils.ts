import hexToRgba = require("hex-to-rgba");

export function hexToGlColor(hex: stirng) {
    const [r, g, b, a] = hexToRgba(hex).split(', ')
        .map(c => c.replace(/\D+/g, ''))
        .map(c => +c / 255);

    return { r, g, b, a };
}

export async function loadImages(sources: string[]) {
    const images = [];
    const promises = sources.map(async (src) => {
        images.push(await loadImg(src));
    });

    await Promise.all(promises);
    return images;
}

export function loadImg(src: string) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = reject;

        img.src = src;
    });
}