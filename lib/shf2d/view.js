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

shRequire(["shellfish/low", "shellfish/mid", "shellfish/matrix"], (low, mid, mat) =>
{
    const d = new WeakMap();

    /**
     * Class representing a view displaying a 2D scene.
     * 
     * @memberof shf3d
     * @property {color} ambience - (default: `rgb(0, 0, 0)`) The ambient light color.
     * @property {color} color - (default: `rgb(0, 0, 0)`) The background color.
     * @property {shf3d.Camera} camera - (default: `null`) The active camera.
     * @property {shf3d.Entity} scene - (default: `null`) The scene to show.
     */
    exports.View = class View extends mid.Canvas
    {
        constructor()
        {
            super();
            d.set(this, {
                renderPending: false,
                ctx: this.get().getContext("2d"),
                scene: null
            });

            this.notifyable("scene");

            const priv = d.get(this);

            this.onInitialization = () =>
            {
                if (priv.scene)
                {
                    this.invalidateScene();
                }
            }

            this.onOriginalWidthChanged = () =>
            {
                this.invalidateScene();
            };

            this.onOriginalHeightChanged = () =>
            {
                this.invalidateScene();
            };
        }

        get scene() { return d.get(this).scene; }
        set scene(s)
        {
            if (d.get(this).scene)
            {
                d.get(this).scene.disconnect("invalidate", this);
                d.get(this).scene.referenceRemove(this);
            }
            d.get(this).scene = s;
            s.referenceAdd(this);
            this.sceneChanged();

            s.connect("invalidate", this, () => { this.invalidateScene(); });
        }

        invalidateScene()
        {
            const priv = d.get(this);
            if (! priv.renderPending)
            {
                priv.renderPending = true;
                const handle = low.addFrameHandler(() =>
                {
                    handle.cancel();
                    this.renderScene();
                    priv.renderPending = false;
                });
            }
        }

        renderScene()
        {
            //console.log("render scene into " + this.objectLocation);
            const priv = d.get(this);

            if (! priv.scene)
            {
                return;
            }

            const ctx = priv.ctx;

            if (priv.scene && priv.scene.visible)
            {
                const sceneInfo = {
                    viewMatrix: mat.identityM(3),
                    colliders: []
                };
                priv.scene.prepareScene(mat.scalingM(mat.vec(1, 1, 1)), sceneInfo);
                
                sceneInfo.colliders.forEach((entry) =>
                {
                    const objs = priv.scene.collisionsWith(entry.vertex);
                    entry.target.collide(objs);
                });
               
                ctx.setTransform(
                    this.originalWidth / 2, 0,
                    0, this.originalHeight / 2,
                    this.originalWidth / 2, this.originalHeight / 2
                );
                ctx.clearRect(-1, -1, 2, 2);
                
                priv.scene.renderScene(ctx, mat.scalingM(mat.vec(1, 1, 1)), sceneInfo);
            }

            this.children.filter(c => c !== priv.scene && c.renderScene).forEach((obj) =>
            {
                obj.renderScene(ctx);
            });
        }

        toSceneLocation(x, y)
        {
            console.log("toSceneLocation: " + x + ", " + y);
            if (x === null || y === null)
            {
                return null;
            }
            if (d.get(this).scene)
            {
                const bbox = this.bbox;
                const px = x / bbox.width;
                const py = y / bbox.height;
                return d.get(this).scene.vec2(-1.0 + 2.0 * px, -1.0 + 2.0 * py);
            }
            else
            {
                return null;
            }
        }

        add(child)
        {
            if (child.invalidateScene)
            {
                child.connect("invalidateScene", this, () =>
                {
                    this.renderScene();
                    //this.invalidateScene();
                });
            }
            child.parent = this;
        }
    };
});
