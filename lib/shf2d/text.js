/*******************************************************************************
This file is part of Shellfish-2D.
Copyright (c) 2020 - 2021 Martin Grimme <martin.grimme@gmail.com>

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
     * Class representing a text shape.
     * 
     * Without transformations, the text is located at (0, 0).
     * 
     * @memberof shf2d
     * @extends shf2d.Entity
     */
    exports.Text = class Text extends shape.Shape
    {
        constructor()
        {
            super();
            d.set(this, {
                text: "",
                fontFamily: "Sans-Serif",
                fontSize: 12,
                bold: false,
                italic: false,
                horizontalAlignment: "left",
                overflowBehavior: "clip",  // clip | ellipsis | wrap
                width: -1,
                layout: []
            });

            this.notifyable("bold");
            this.notifyable("fontFamily");
            this.notifyable("fontSize");
            this.notifyable("horizontalAlignment");
            this.notifyable("italic");
            this.notifyable("overflowBehavior");
            this.notifyable("text");
            this.notifyable("width");
        }

        get bold() { return d.get(this).bold; }
        set bold(value)
        {
            d.get(this).bold = value;
            d.get(this).layout = [];
            this.boldChanged();
            this.invalidate();
        }

        get italic() { return d.get(this).italic; }
        set italic(value)
        {
            d.get(this).italic = value;
            d.get(this).layout = [];
            this.italicChanged();
            this.invalidate();
        }

        get text() { return d.get(this).text; }
        set text(t)
        {
            d.get(this).text = t;
            d.get(this).layout = [];
            this.textChanged();
            this.invalidate();
        }

        get fontFamily() { return d.get(this).fontFamily; }
        set fontFamily(f)
        {
            d.get(this).fontFamily = f;
            d.get(this).layout = [];
            this.fontFamilyChanged();
            this.invalidate();
        }

        get horizontalAlignment() { d.get(this).horizontalAlignment; }
        set horizontalAlignment(a)
        {
            d.get(this).horizontalAlignment = a;
            this.horizontalAlignmentChanged();
            this.invalidate();
        }

        get overflowBehavior() { d.get(this).overflowBehavior; }
        set overflowBehavior(m)
        {
            d.get(this).overflowBehavior = m;
            d.get(this).layout = [];
            this.overflowBehaviorChanged();
            this.invalidate();
        }

        get width() { return d.get(this).width; }
        set width(w)
        {
            d.get(this).width = w;
            d.get(this).layout = [];
            this.widthChanged();
            this.invalidate();
        }

        layoutText(ctx, text, width)
        {
            text += "\n";

            /* [[line, width, height], ...] */
            const layout = [];
            let mayBreakAfter = 0;
            let line = "";
            let linePos = 0;
            for (let i = 0; i < text.length; ++i)
            {
                const c = text[i];
                if (c === "\n") console.log("newline");

                // update valid linebreak position
                if (c === " " || c === "-" || c === "\n")
                {
                    mayBreakAfter = linePos;
                    console.log("may break after " + i);
                }

                const measurements = ctx.measureText(line + c);
                console.log("measure " + (line + c) + " " + measurements.width + " vs " + width);
                if (c === "\n" || (width > 0 && measurements.width > width))
                {
                    // break lines at last valid linebreak position
                    const a = mayBreakAfter > 0 ? line.substr(0, mayBreakAfter + 1) : line;
                    const b = mayBreakAfter > 0 ? line.substr(mayBreakAfter + 1) : "";
                    const aTrimmed = a.replace(/ *$/, "");
                    console.log("break \"" + line + "\" into: " + JSON.stringify([a, b]));
                    const m = ctx.measureText(aTrimmed);
                    //console.log(m);
                    // having a hardcoded value for the line height is less precise but
                    // still good enough and helps with platforms that provide only
                    // limited font metrics
                    layout.push([aTrimmed, m.width, 1.2]); //m.fontBoundingBoxAscent + m.fontBoundingBoxDescent]);

                    line = b;
                    linePos = b.length;
                    if (c !== " " && c !== "\n")
                    {
                        line += c;
                        ++linePos;
                    }
                    mayBreakAfter = 0;
                }
                else
                {
                    line += c;
                    ++linePos;
                }
            }

            console.log(JSON.stringify(layout));
            return layout;
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

            ctx.font = `${priv.bold ? "bold" : ""} ${priv.italic ? "italic" : ""} 1px "${priv.fontFamily}`;
            ctx.textBaseline = "top";

            if (priv.layout.length === 0)
            {
                if (priv.overflowBehavior === "wrap")
                {
                    priv.layout = this.layoutText(ctx, priv.text, priv.width);
                }
                else if (priv.overflowBehavior === "ellipsis")
                {
                    const ellipsisMeasurements = ctx.measureText("...");
                    console.log("ellipsis: " + ellipsisMeasurements.width);
                    priv.layout = this.layoutText(ctx, priv.text, priv.width - ellipsisMeasurements.width);
                    priv.layout = priv.layout.slice(0, 1);
                    priv.layout[0][0] += "...";
                    priv.layout[0][1] = ctx.measureText(priv.layout[0][0]).width;
                }
                else if (priv.overflowBehavior === "clip")
                {
                    priv.layout = this.layoutText(ctx, priv.text, -1);
                }
            }

            if (priv.overflowBehavior === "clip")
            {
                let h = 0;
                priv.layout.forEach(item => h += item[2]);
                ctx.beginPath();
                ctx.rect(0, 0, priv.width, h);
                ctx.clip();
            }
            

            let tx = 0;
            let ty = 0;
            priv.layout.forEach(item =>
            {
                const line = item[0];
                const w = item[1];
                const h = item[2];

                if (priv.horizontalAlignment === "left")
                {
                    tx = 0;
                }
                else if (priv.horizontalAlignment === "center")
                {
                    tx = (priv.width - w) / 2;
                }
                else
                {
                    tx = priv.width - w;
                }

                ctx.fillText(line, tx, ty);
                ctx.strokeText(line, tx, ty);

                ty += h;
            });

            ctx.restore();
        }
    };
});