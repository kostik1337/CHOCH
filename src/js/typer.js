async function print_2d(text) {
    const lineHeight = 20;
    let print,
        ms=200,
        w="+", // regex quantifier for how many characters to process, e.g '{,3}', '+'. Empty string is the same as '{1}'
        tail = text.shift(),
        [x, y] = [40, 40],
        font = "24px bold 'Andale Mono', 'Courier New', monospace",
        color = "#0f0",
        ctx = textCtx;//document.querySelector("#canvas2d").getContext("2d");
        
    while (tail != "№") {
        try {
            // this can accidentally swallow the end of the text so each line must end with "№" that throws an exception
            eval(tail);
            tail="№";
        }
        catch (_) {
            await new Promise(resolve => setTimeout(resolve, ms)); // sleep. DON'T delete ';'!!!
            [_,print,tail] = tail.match(`([^№]${w})(.+)?`);
            ctx.font = font;
            ctx.fillStyle = color;
            ctx.fillText(print, x, y);
            x += ctx.measureText(print).width;
        }
        if(tail=="№") { 
            tail = text.shift(); 
            x = 0; 
            y += lineHeight; 
        }
    }
}