const DEFAULT_CHAR_HEIGHT = 5;
const DEFAULT_COLOR = '#000';

const initFont = ({ height=DEFAULT_CHAR_HEIGHT, ...chars }={}, ctx) => {
    if (!chars) {
        console.error('No font provided!');
        return
    }
    if (!ctx) {
        console.error('No context provided');
        return
    }

    const bin2arr = (bin, width) => bin.match(new RegExp(`.{${width}}`, 'g'));
    const isNumber = code => code > 0;

    return (string, x=0, y=0, size=24, color=DEFAULT_COLOR) => {
        const renderChar = (charX, char) => {
            const pixelSize = size/height;
            const fontCode = chars[char.charCodeAt()] || '';
            const binaryChar = isNumber(fontCode) ? fontCode : fontCode.codePointAt();

            const binary = (binaryChar || 0).toString(2);

            const width = Math.ceil(binary.length / height);
            const marginX = charX + pixelSize;
            const formattedBinary = binary.padStart(width * height, 0);
            const binaryCols = bin2arr(formattedBinary, height);

            console.debug('Rendering char', char, char.charCodeAt(), fontCode, binaryChar, binaryCols);

            binaryCols.map((column, colPos) =>
                [...column].map((pixel, pixPos) => {
                    ctx.fillStyle = !+pixel ? 'transparent' : color; // pixel == 0 ?
                    ctx.fillRect(x + marginX + colPos * pixelSize, y + pixPos * pixelSize, pixelSize, pixelSize);
                })
            );

            return charX + (width+1)*pixelSize
        };

        console.debug('Rendering string', string);
        [...string].reduce(renderChar, 0);
    };
};
