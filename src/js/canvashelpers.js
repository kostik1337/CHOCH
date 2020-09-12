async function print_2d(c, text, em, cancelFn, textUpdatedCb, typingCb) {
    let print,
        ms = 0,
        w = "+", // regex quantifier for how many characters to process, e.g '{,3}', '+'. Empty string is the same as '{1}'
        tail = text.shift(),
        [x, y] = [0, 0],
        font,
        color = "#9c4",
        typing = true,
        n = { valueOf() { y += 1.4 * em; x = 1.0 * em; } },
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
            while (tail) {
                await wait(ms)
                if (cancelFn()) return
                [_, print, tail] = tail.match(`(^.${w})(.+)?`);
                if (print !== " ") typingCb();
                c.font = font;
                c.shadowColor = (c.fillStyle = color) + 'b'; // #rgb -> #rgba
                c.shadowBlur = 12;
                c.fillText(print, x, y);
                textUpdatedCb()
                x += c.measureText(print).width;
            }
        }
        if (!tail || tail.length == 0) tail = text.shift();
    }
}

let cliFont = "bold 1.4rem 'Andale Mono', 'Courier New', monospace";
let dialogFont = "bold italic 2rem 'Lucida Sans Unicode', 'Lucida Grande', sans-serif";
let logoFont = "bold 6rem Impact, Charcoal, sans-serif";

let startCutsceneData = (w, h) => [
    `!n+n;ms=50;font="${cliFont}";color='#9c4'`, "[totosz@vlt1337 ~]$ ",
    '_500',
    "!color='#ccc';w=''", "hack https://asodih90xvy809.com/90as8y/",

    "!+n;ms=300", ". . .  ",

    "!n+n;color='#999';ms=50;w='+'",
    "HTTP/2 404", "!+n",
    "content-type: text/html", "!+n",
    "content-length: 1565", "!+n",
    `date: ${new Date().toDateString()}`, "!n+n",

    "<!DOCTYPE html>", "!+n",
    "<html lang=en>", "!+n",
    "<title>Error 404 (Not Found)!!1</title>", "!+n",
    "<p>The requested URL was not found on this server. Tough luck :-)",

    "!n+n,ms=500;color='#f83'", "[ERROR] Hacking failed with code 0x04729632",

    "!+n;color='#9c4'", "[totosz@vlt1337 ~]$ ",

    "!x_=x;y_=y", // save caret location

    '_1200',
    `!;y=${h}-6*em;x=17*em;ms=60;w='';color='#baa';font="${dialogFont}"`,
    "@#$%! *They* moved the page again.", "!+n",
    '_800',
    `!;c.fillStyle='#000';c.shadowBlur=0;c.clearRect(0,y-4*em,${w},${h})`,
    `!;ms=60;y=${h}-6*em;x=17*em`, "You can hide it but I'll find it anyway!",
    '_800',
    `!;c.fillStyle='#000';c.shadowBlur=0;c.clearRect(0,y-4*em,${w},${h})`,

    `!;x=x_;y=y_;ms=50;color='#ccc';w='';font="${cliFont}"`, "./choch https://asodih90xvy809.com/ --find-missing-page",
    "!;ms=800", " ", "!;ms=50", "--please",

    '_400',
    `!;c.fillStyle='#000';c.shadowBlur=0;c.clearRect(0,0,${w},${h});y=2.5*em`,
    "!n+n;ms=500;w='+',color='#fff'", "Initialize crawler ", "!;x=42*em;color='#9c4'", "[ OK ]",
    "!+n;color='#fff'", "Generate search route ", "!;x=42*em;color='#9c4'", "[ OK ]",
    "!+n;color='#fff'", "Calculate expression matcher ", "!;x=42*em;color='#9c4'", "[ OK ]",
    "!+n;color='#fff'", "Perform automated search ", "_500", "!;x=42*em;color='#f83'", "[FAIL]",
    "!n+n;color='#fff';x=13*em", "Manual guidance required. Press enter to start",
    "!w='';ms=200", ". . .  "
];

let endCutsceneData = (w, h, isSpeedrun, timerTime, difficulty) => {
    let speedrunElements = isSpeedrun ? [
        `overall-time: ${timerTime}`, "!+n",
        `difficulty: ${difficulty}`, "!+n",
    ] : []
    return [
        `!n+n;ms=50;font="${cliFont}";color='#9c4';w='+'`, "[totosz@vlt1337 ~]$ ",
        "_1000",
        "!color='#ccc';w=''", "hack https://asodih90xvy809.com/90as8y/",

        "!+n;ms=300", ". . .  ",
        "!n+n;color='#ccc';ms=50;w='+'",
        "HTTP/2 ", "!color='#fff'", "200 OK", "!+n;color='#ccc'",
        "content-type: text/html", "!+n",
        "content-length: 2273", "!+n",
        ...speedrunElements,
        `date: ${new Date().toDateString()}`, "!n+n",

        "<!DOCTYPE html>", "!+n",
        "<html lang=en>", "!+n",
        "<title>Hello there!</title>", "!+n",
        `<p>${isSpeedrun ? "How did you get here so fast?!" : "You're welcome!"}</p>`,
        "_500", "!n+n;color='#9c4'", "[totosz@vlt1337 ~]$ ",

        '_1200',
        `!;y=${h}-6*em;x=24*em;ms=60;w='';color='#f80';font="${dialogFont}"`,
        "Finally... I found it.",

        `_${isSpeedrun ? 10000 : 3000}`,
        `!c.clearRect(0,0,${w},${h});y=2.5*em;+n;ms=50;font="${cliFont}";color='#9c4'`,
        'CHOCH',
        "_1500",
        `!+n;color='#ccc'`,
        "A game by ", `!color='#f22'`, "kostik1337", `!color='#ccc'`, " & ", `!color='#44f'`, "lampysprites",
        "_400", "!n+n;color='#ccc'",
        "Thank you for playing!",
        "_10000"
    ];
}