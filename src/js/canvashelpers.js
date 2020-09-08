async function print_2d(c, text, cancelFn, textUpdatedCb) {
    const lineHeight = 22;
    let print,
        ms = 0,
        w = "+", // regex quantifier for how many characters to process, e.g '{,3}', '+'. Empty string is the same as '{1}'
        tail = text.shift(),
        [x, y] = [0, 0],
        font,
        color = "#0f0",
        n = { valueOf() { y += lineHeight; x = 10; } },
        wait = (t) => new Promise(resolve => setTimeout(resolve, t))

    while (tail) {
        if (cancelFn()) return
        if (tail.startsWith('!')) {
            eval(tail.substring(1));
            tail = "";
        } else if (tail.startsWith('_')) {
            await wait(tail.substring(1))
            tail = "";
        } else {
            await wait(ms)
            if (cancelFn()) return
            [_, print, tail] = tail.match(`(^.${w})(.+)?`);
            c.font = font;
            c.shadowColor = (c.fillStyle = color) + 'b'; // #rgb -> #rgba
            c.shadowBlur = 12;
            c.fillText(print, x, y);
            textUpdatedCb()
            x += c.measureText(print).width;
        }
        if (!tail || tail.length == 0) tail = text.shift();
    }
}

let cliFont = "bold 22px 'Andale Mono', 'Courier New', monospace";
let dialogFont = "bold italic 32px 'Lucida Sans Unicode', 'Lucida Grande', sans-serif";

let startCutsceneData = (w, h) => [
    `!+n;ms=50;font="${cliFont}";color='#0f0'`, "[totosz@vlt1337 ~]$ ",
    '_500',
    "!;ms=50;color='#bbb';w=''", "hack https://asodih90xvy809.com/90as8y/",

    "!+n;ms=300", ". . .  ",

    "!n+n;color='#888';ms=50;w='+'",
    "HTTP/2 404", "!+n",
    "content-type: text/html", "!+n",
    "content-length: 1565", "!+n",
    `date: ${new Date().toDateString()}`, "!n+n",

    "<!DOCTYPE html>", "!+n",
    "<html lang=en>", "!+n",
    "<meta charset=utf-8>", "!+n",
    "<title>Error 404 (Not Found)!!1</title>", "!+n",
    "<p>The requested URL was not found on this server. Tough luck :-)",

    "!n+n,ms=500;color='#c00'", "[ERROR] Hacking failed with code 0x04729632",

    "!+n;color='#0f0'", "[totosz@vlt1337 ~]$ ",

    "!x_=x;y_=y", // save caret location

    '_1200',
    `!;y=600;x=200;ms=60;w='';color='#f80';font="${dialogFont}"`,
    "Damn it... They moved it again.", "!+n",
    '_800',
    `!;c.fillStyle='#000';c.shadowBlur=0;c.clearRect(0,y-60,${w},${h})`,
    "!;ms=60;y=600;x=200", "You can hide it from me but I'll find it anyway!",
    '_800',
    `!;c.fillStyle='#000';c.shadowBlur=0;c.clearRect(0,y-60,${w},${h})`,

    `!;x=x_;y=y_;ms=50;color='#bbb';w='';font="${cliFont}"`, "hack https://asodih90xvy809.com/ --find-missing-page",
    "!;ms=800", " ", "!;ms=50", "--please",

    '_400',
    `!;c.fillStyle='#000';c.shadowBlur=0;c.clearRect(0,0,${w},${h});y=40`,
    "!n+n;ms=500;w='+',color='#fff'", "Initialize crawler ", "!;x=700;color='#0f0'", "[ OK ]",
    "!+n;color='#fff'", "Generate search route ", "!;x=700;color='#0f0'", "[ OK ]",
    "!+n;color='#fff'", "Calculate expression matcher ", "!;x=700;color='#0f0'", "[ OK ]",
    "!+n;color='#fff'", "Perform automated search ", "_1200", "!;x=700;color='#f00'", "[FAIL]",
    "!n+n;color='#fff';x=200", "Manual guidance required. Press enter to start",
    "!w='';ms=200", ". . .  "
];

let endCutsceneData = (w, h) => [
    `!+n;ms=100;font="${cliFont}";color='#0f0';w=''`, "Congratulations! You won!"
];