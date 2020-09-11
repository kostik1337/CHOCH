# еггог ЧОЧ 
## eggog CHOCH

[[js3k entry](https://js13kgames.com/entries/choch)] [[itch.io](https://kostik1337.itch.io/choch)]

A 10-20 minutes long game about a web crawler, metaphorized as spider, scraping the private network, metaprhorized as 2d space full of deadly lazers, looking for the oh-so-important missing page of unknown content.

After playing through the intro scene some might object that a moved page must be HTTP code 301. However, with a proper redirect, no adventure could've taken place. Please add this to the list of things that fiction did horribly incorrect.

This project was made for [js13k](https://js13kgames.com) event. Another cool thing besides fitting into a 13k bundle, is the graphics code handled by a single shader program (with another one for postprocessing), sans menus that only have cool post-effect.

## Building and Running
### Debug
enables cheats & debug popup:
```sh
git clone https://github.com/kostik1337/CHOCH.git
cd CHOCH
npm install
gulp
```
the last command will also start the debug server

### Release 
Under 13k bundle. You'll need [Shader Minifier](http://www.ctrl-alt-test.fr/glsl-minifier/), and Mono on mac/linux/etc to run it. In the following commands use absolute paths.
Windows:
```
SHADER_MINIFIER_CMD='C:\path\to\shader_minifier.exe' gulp build_release
```
not Windows (same exe🤷‍♀️):
```
SHADER_MINIFIER_CMD='mono /path/to/shader_minifier.exe' gulp build_release
```
output files are written to ./build/

### Credits
- [kostik](https://twitter.com/kostik13337) - Idea, most of the code, shaders, most of level design, sound design and music
- [lampy](https://twitter.com/lampysprites) - Remaining code, parts of the design - mostly in form of advice, spiritual help

### License
WTFPL2 applies. See LICENSE.md for details.
This project includes code from [Freeverb](https://github.com/mmckegg/freeverb) (see file src/js/freeverb.js) available under MIT license
