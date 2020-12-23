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

shRequire([__dirname + "/shape.js", "shellfish/matrix"], (shape, mat) =>
{                          
    const d = new WeakMap();

    /**
     * Class representing a circle, or a segment of a circle.
     * 
     * Without transformations, the circle is centered around (0, 0) with a
     * radius of 1.
     * 
     * @memberof shf2d
     * @extends shf2d.Entity
     */
    exports.Circle = class Circle extends shape.Shape
    {
        constructor()
        {
            super();
            d.set(this, {
                begin: 0.0,
                end: 2 * Math.PI
            });

            this.notifyable("begin");
            this.notifyable("end");
        }

        get begin() { return d.get(this).begin / Math.PI * 180; }
        set begin(b)
        {
            d.get(this).begin = b / 180.0 * Math.PI;
            this.beginChanged();
            this.invalidate();
        }

        get end() { return d.get(this).end / Math.PI * 180; }
        set end(e)
        {
            d.get(this).end = e / 180.0 * Math.PI;
            this.endChanged();
            this.invalidate();
        }

        collisionsWith(v)
        {
            const transformed = mat.mul(this.inverseMatrix, v);
            
            if (transformed[0][0] > 1 || transformed[1][0] > 1)
            {
                return [];
            }
            
            transformed[2][0] = 0;
            const l = mat.length(transformed);

            if (l === 0)
            {
                return [this];
            }
            else if (l > 1.0)
            {
                return [];
            }

            const unitV = mat.mul(transformed, 1 / l);
            let alpha = Math.sign(transformed[1][0]) * Math.acos(mat.dot(mat.vec(1, 0, 0), unitV));
            if (alpha < 0) alpha = 2 * Math.PI + alpha;

            let begin = d.get(this).begin;
            let end = d.get(this).end;
            if (begin < 0) begin = 2 * Math.PI + begin;
            if (end < 0) end = 2 * Math.PI + end;

            //console.log("alpha: " + alpha + ", begin: " + begin + ", end: " + end);

            if ((begin < end && alpha >= begin && alpha <= end) ||
                (begin > end && (alpha >= begin || alpha <= end)))
            {
                return [this];
            }
            else
            {
                return [];
            }
        }

        renderScene(ctx, om, sceneInfo)
        {
            const priv = d.get(this);

            let begin = priv.begin;
            let end = priv.end;
            if (begin < 0.0) begin = 2 * Math.PI + begin;
            if (end < 0.0) end = 2 * Math.PI + end;

            this.prepare(ctx);

            ctx.save();
            const m = this.matrix;
            ctx.transform(m[0][0], m[1][0], m[0][1], m[1][1], m[0][2], m[1][2]);

            ctx.fillStyle = this.color.toCss();
            ctx.strokeStyle = this.borderColor.toCss();
            ctx.lineWidth = this.borderWidth;
            ctx.globalAlpha = this.opacity;

            ctx.beginPath();

            if (Math.abs(Math.abs(begin - end) - 2 * Math.PI) > 0.001)
            {
                ctx.moveTo(Math.cos(end), Math.sin(end));
                ctx.lineTo(0, 0);
                ctx.lineTo(Math.cos(begin), Math.sin(begin));
            }
            ctx.ellipse(0, 0, 1, 1, 0, begin, end, false);

            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }
    };
});