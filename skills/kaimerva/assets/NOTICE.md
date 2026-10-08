# Kaimerva portable assets

`starter/` is a self-contained, generated copy of the original Kaimerva demo
source, its explicit example content, six original SVG figure views, the approved
portal icon and local build/edit tools. Its manifest records SHA-256 hashes for
the approved payload files. It excludes launch media, research notes, private
CMS records and portraits. `starter/LICENSE` retains the MIT notice below;
`starter/data/assets.json` retains the runtime artwork ledger. Three.js is not
embedded in the skill: the generated project's lockfile selects it, and its
build copies the dependency's own MIT notice into the public output.

`instruments/figure-passage.js` is original procedural Three.js code, authored
by Orestis Oikonomou with AI-assisted implementation. It is copied unchanged
from the starter's tested `src/figure-passage.js`. Its three housings and their
movement use local meshes; no third-party models, textures or application code
are embedded. The host must supply Three.js separately under its own MIT notice.

`kaimerva-icon.png` is the approved cinematic portal artwork, copied unchanged
from `kaimerva-portal-v3-cinematic.png`.

AI-assisted artwork: art direction and selection by **Orestis Oikonomou**;
generated with OpenAI's built-in image-generation tool on **2026-10-08**.

The icon, instrument code and starter source are included under the repository's MIT license,
reproduced below so copied skills retain the license and attribution. There is no additional
requirement to display a visible credit in generated projects.

## MIT License

Copyright (c) 2026 Orestis Oikonomou

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
