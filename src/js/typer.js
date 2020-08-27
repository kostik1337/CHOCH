async function print_2d(text, canvasTextureApplyFn) {
    const lineHeight = 21;
    let print,
        ms=0,
        w="+", // regex quantifier for how many characters to process, e.g '{,3}', '+'. Empty string is the same as '{1}'
        tail = text.shift(),
        [x, y] = [0, 40],
        font,
        color = "#0f0",
        n = {valueOf(){y += lineHeight; x = 45; }}
        cctx = document.querySelector("#canvas2d").getContext("2d");
        
    while (tail != "№") {
        try {
            // this can accidentally swallow the end of the text so each line must end with "№" that throws an exception
            eval(tail);
            tail="№";
        }
        catch (_) {
            await new Promise(resolve => setTimeout(resolve, ms)); // sleep. DON'T delete ';'!!!
            [_,print,tail] = tail.match(`([^№]${w})(.+)?`);
            cctx.font = font;
            cctx.shadowColor = (cctx.fillStyle = color) + 'b'; // #rgb -> #rgba
            cctx.shadowBlur = 12;
            cctx.fillText(print, x, y);
            canvasTextureApplyFn(cctx)
            x += cctx.measureText(print).width;
        }
        if(tail=="№") tail = text.shift();
    }
}