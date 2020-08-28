async function print_2d(c, text, cancelFn, textUpdatedCb) {
    const lineHeight = 22;
    let print,
        ms=0,
        w="+", // regex quantifier for how many characters to process, e.g '{,3}', '+'. Empty string is the same as '{1}'
        tail = text.shift(),
        [x, y] = [0, 0],
        font,
        color = "#0f0",
        n = {valueOf(){y += lineHeight; x = 10; }}
        
    while (tail != "№") {
        if (cancelFn()) return
        try {
            // this can accidentally swallow the end of the text so each line must end with "№" that throws an exception
            eval(tail);
            tail="№";
        }
        catch (_) {
            await new Promise(resolve => setTimeout(resolve, ms)); // sleep. DON'T delete ';'!!!
            if (cancelFn()) return
            [_,print,tail] = tail.match(`([^№]${w})(.+)?`);
            c.font = font;
            c.shadowColor = (c.fillStyle = color) + 'b'; // #rgb -> #rgba
            c.shadowBlur = 12;
            c.fillText(print, x, y);
            textUpdatedCb()
            x += c.measureText(print).width;
        }
        if(tail=="№") tail = text.shift();
    }
}