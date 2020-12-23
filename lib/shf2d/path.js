/*******************************************************************************
This file is part of Shellfish-2D.
Copyright (c) 2020 Martin Grimme <martin.grimme@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*******************************************************************************/

"use strict";

shRequire([__dirname + "/shape.js"], (shape) =>
{                   
    const d = new WeakMap();

    /**
     * Class representing a path. Uses the SVG path syntax.
     * 
     * @memberof shf2d
     * @extends shf2d.Entity
     */
    exports.Path = class Path extends shape.Shape
    {
        constructor()
        {
            super();
            d.set(this, {
                path: ""
            });

            this.notifyable("path");
        }

        get path() { return d.get(this).path; }
        set path(p)
        {
            d.get(this).path = p;
            this.pathChanged();
            this.invalidate();
        }

        renderScene(ctx, om, sceneInfo)
        {
            const priv = d.get(this);

            this.prepare(ctx);

            ctx.save();
            const m = this.matrix;
            ctx.transform(m[0][0], m[1][0], m[0][1], m[1][1], m[0][2], m[1][2]);

            ctx.fillStyle = this.color.toCss();
            ctx.strokeStyle = this.borderColor.toCss();
            ctx.lineWidth = this.borderWidth;
            ctx.globalAlpha = this.opacity;

            const path2d = new Path2D(priv.path);
            ctx.fill(path2d);
            ctx.stroke(path2d);

            ctx.restore();
        }
    };
});