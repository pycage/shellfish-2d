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
     * Class representing a rectangle.
     * 
     * Without transformations, the rectangle is centered around (0, 0) with a
     * side length of 1 each.
     * 
     * @memberof shf2d
     * @extends shf2d.Entity
     */
    exports.Rectangle = class Rectangle extends shape.Shape
    {
        constructor()
        {
            super();
            d.set(this, {

            });
        }

        collisionsWith(v)
        {
            const transformed = mat.mul(this.inverseMatrix, v);
            
            if (Math.abs(transformed[0][0]) <= 0.5 &&
                Math.abs(transformed[1][0]) <= 0.5)
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

           this.prepare(ctx);

           //console.log("RENDER RECT");
           ctx.save();
           const m = this.matrix;
           ctx.transform(m[0][0], m[1][0], m[0][1], m[1][1], m[0][2], m[1][2]);
           
           ctx.fillStyle = this.color.toCss();
           ctx.strokeStyle = this.borderColor.toCss();
           ctx.lineWidth = this.borderWidth;
           ctx.globalAlpha = this.opacity;

           ctx.fillRect(0 - 0.5, 0 - 0.5, 1, 1);
           ctx.strokeRect(0 - 0.5, 0 - 0.5, 1, 1);
           ctx.restore();
       }
    };
});