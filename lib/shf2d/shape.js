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

shRequire([__dirname + "/entity.js"], (entity) =>
{                          
    const d = new WeakMap();

    /**
     * Abstract base class for 2D shapes.
     * 
     * @memberof shf2d
     * @extends shf2d.Entity
     */
    exports.Shape = class Shape extends entity.Entity
    {
        constructor()
        {
            super();
            d.set(this, {
                borderColor: this.rgb(0.0, 0.0, 0.0),
                borderWidth: 0.01,
                color: this.rgba(0.0, 0.0, 0.0, 0.0),
                opacity: 1.0
            });

            this.notifyable("borderColor");
            this.notifyable("borderWidth");
            this.notifyable("color");
            this.notifyable("opacity");
        }

        get borderColor() { return d.get(this).borderColor; }
        set borderColor(c)
        {
            const col = typeof c === "string" ? this.colorName(c) : c;
            d.get(this).borderColor = col;
            this.borderColorChanged();
            this.invalidate();
        }

        get borderWidth() { return d.get(this).borderWidth; }
        set borderWidth(w)
        {
            d.get(this).borderWidth = w;
            this.borderWidthChanged();
            this.invalidate();
        }

        get color() { return d.get(this).color; }
        set color(c)
        {
            const col = typeof c === "string" ? this.colorName(c) : c;
            d.get(this).color = col;
            this.colorChanged();
            this.invalidate();
        }

        get opacity() { return d.get(this).opacity; }
        set opacity(o)
        {
            d.get(this).opacity = o;
            this.opacityChanged();
            this.invalidate();
        }
    };
});