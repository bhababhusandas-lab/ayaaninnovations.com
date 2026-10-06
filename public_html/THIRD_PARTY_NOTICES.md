# Animation references and third-party notices

## Three.js

The optional cinematic preview bundles Three.js 0.180.0 for its WebGL scene.

Project: <https://threejs.org/>  
License: MIT  
Copyright © 2010-2026 three.js authors

The Ayaan Innovations redesign uses project-specific, plain JavaScript and CSS
adaptations of the animation patterns identified below. The React component
distributions are not bundled. The references informed the architecture and
timing of normalized word reveals, sticky stacked sections, and grouped masked
text staggering; the page composition and visual treatment are specific to this
website.

Source and license files were reviewed on September 29, 2026.

## Animata

Repository: <https://github.com/codse/animata>

Referenced implementations:

- Normalized word opacity reveal: <https://github.com/codse/animata/blob/main/animata/text/scroll-reveal.tsx>
- Sticky stacked sections and inner-content scaling: <https://github.com/codse/animata/blob/main/animata/scroll/stacked-sections.tsx>

Adaptations use page scroll for the word reveal and the site's own project-panel
layout for the sticky stack. They do not include Animata's React wrappers.

License source: <https://github.com/codse/animata/blob/main/LICENSE.md>

```text
MIT License

Copyright (c) Animata

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

## Animate UI

Repository: <https://github.com/imskyleen/animate-ui>

The supplied <https://github.com/animate-ui/animate-ui> link redirects to this
repository.

Referenced implementation:

- Grouped text staggering: <https://github.com/imskyleen/animate-ui/blob/main/apps/www/registry/primitives/texts/splitting/index.tsx>

The adaptation uses grouped text and staggered entrance timing with the site's
own CSS masks and plain JavaScript. It does not redistribute the original React
component.

License source: <https://github.com/imskyleen/animate-ui/blob/main/LICENSE.md>

```text
MIT + Commons Clause License Condition

Copyright (c) 2025 Elliot Sutton

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell or redistribute the components themselves in their original form—whether alone or in a bundle.**
## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Additional references reviewed

These repository pages and documentation were inspected for animation ideas.
No implementation from these repositories was copied as part of the adaptations
documented above:

- FlowMotion: <https://github.com/piratesofsi/flowmotion> — repository README and animation-library structure.
- lakbychance/animations: <https://github.com/lakbychance/animations> — repository README and described interaction examples.
- Motion Anything: <https://github.com/nexu-io/motion-anything> — repository README, recipe directory listing, and <https://github.com/nexu-io/motion-anything/blob/main/ATTRIBUTION.md>.

These reference links do not imply incorporation of their code or assets, or
endorsement of this website by their authors.
