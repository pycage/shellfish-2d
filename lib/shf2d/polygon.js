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
    function testEdge(a, b, c)
    {
        let aX = a[0][0];
        let aY = a[1][0];
        let bX = b[0][0];
        let bY = b[1][0];
        let cX = c[0][0];
        let cY = c[1][0];

        if (aY === bY && bY === cY)
        {
            if (bX <= aX && aX <= cX || cX <= aX && aX <= bX)
            {
                return 0;
            }
            else
            {
                return 1;
            }
        }
        else if (aX === bX && aY === bY)
        {
            return 0;
        }
        
        if (bY > cY)
        {
            const tX = cX;
            const tY = cY;
            cX = bX;
            cY = bY;
            bX = tX;
            bY = tY;
        }

        if (aY <= bY || aY > cY)
        {
            return 1;
        }

        const delta = (bX - aX) * (cY - aY) - (bY - aY) * (cX - aX);
        return delta > 0 ? -1
                         : delta < 0 ? 1
                                     : 0;
    }
    
    const d = new WeakMap();

    /**
     * Class representing a polygon.
     * 
     * @memberof shf2d
     * @extends shf2d.Entity
     */
    exports.Polygon = class Polygon extends shape.Shape
    {
        constructor()
        {
            super();
            d.set(this, {
                vertices: []
            });

            this.notifyable("vertices");
        }

        get vertices() { return d.get(this).vertices.slice(); }
        set vertices(vs)
        {
            d.get(this).vertices = vs.slice();
            this.verticesChanged();
            this.invalidate();
        }

        collisionsWith(v)
        {
            const transformed = mat.mul(this.inverseMatrix, v);
         
            const vs = d.get(this).vertices;
            let t = -1;
            for (let i = 0; i < vs.length; ++i)
            {
                const v1 = vs[i];
                const v2 = vs[(i + 1) % vs.length];
                t *= testEdge(transformed, mat.vec(v1.x, v1.y), mat.vec(v2.x, v2.y));
                if (t === 0)
                {
                    // done
                    break;
                }
            }

            return t >= 0 ? [this] : [];
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

            ctx.beginPath();

            let isFirst = true;
            priv.vertices.forEach(v =>
            {
                if (isFirst)
                {
                    ctx.moveTo(v.x, v.y);
                    isFirst = false;
                }
                else
                {
                    ctx.lineTo(v.x, v.y);
                }
            });

            ctx.closePath();

            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    };
});