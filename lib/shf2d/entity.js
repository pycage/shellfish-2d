/*******************************************************************************
This file is part of Shellfish-3D.
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

shRequire(["shellfish/mid", "shellfish/matrix", "shellfish/vector"], (mid, mat, vec) =>
{
    const d = new WeakMap();

    /**
     * Base class for entities in the scene graph.
     * 
     * @memberof shf2d
     * @extends mid.Object
     * 
     * @property {vec2} location - (default: `vec2(0, 0)`) The current location.
     * @property {number} rotationAngle - (default: `0`) The rotation angle in degrees.
     * @property {vec2} scale - (default: `vec2(1, 1)`) The current scale.
     * @property {bool} visible - (default: `true`) Whether the entity is visible.
     */
    exports.Entity = class Entity extends mid.Object
    {
        constructor()
        {
            super();
            d.set(this, {
                scheduledFunctions: [],
                location: this.vec2(0, 0),
                rotationAngle: 0,
                scale: this.vec2(1, 1),
                visible: true,
                inverseMatrix: mat.identityM(3)
            });

            this.notifyable("location");
            this.notifyable("matrix");
            this.notifyable("rotationAngle");
            this.notifyable("scale");
            this.notifyable("visible");

            this.transitionable("location", vec.vec2Interpolate);
            this.transitionable("rotationAngle");
            this.transitionable("scale", vec.vec2Interpolate);

            this.registerEvent("invalidate");

            this.onMatrixChanged = () =>
            {
                d.get(this).inverseMatrix = mat.inv(this.matrix);
                this.invalidate();
            };
        }

        get visible() { return d.get(this).visible; }
        set visible(v)
        {
            d.get(this).visible = v;
            this.visibleChanged();
            this.invalidate();
        }

        get matrix()
        {
            const priv = d.get(this);

            return mat.mul(
                mat.translationM(mat.vec(priv.location.x, priv.location.y)),
                mat.mul(
                    mat.rotationM(mat.vec(1, 0, 0), mat.vec(0, 1, 0), priv.rotationAngle),
                    mat.scalingM(mat.vec(priv.scale.x, priv.scale.y, 1))
                )
            );
        }

        get inverseMatrix() { return d.get(this).inverseMatrix; }

        get rotationAngle() { return d.get(this).rotationAngle; }
        set rotationAngle(a)
        {
            d.get(this).rotationAngle = a;
            this.rotationAngleChanged();
            this.matrixChanged();
        }

        get location() { return d.get(this).location; }
        set location(l)
        {
            if (l)
            {
                d.get(this).location = l;
                this.locationChanged();
                this.matrixChanged();
            }
            else
            {
                throw new Error("Invalid vec2 value.");
            }
        }

        get scale() { return d.get(this).scale; }
        set scale(s)
        {
            if (s)
            {
                d.get(this).scale = s;
                this.scaleChanged();
                this.matrixChanged();
            }
            else
            {
                throw new Error("Invalid vec2 value.");
            }
        }

        /**
         * Creates a 2-component vector.
         * 
         * @memberof shf3d
         * @param {number} x - The X component.
         * @param {number} y - The Y component.
         * @returns {vec2} The vector.
         */
        vec2(x, y)
        {
            return vec.vec2(x, y);
        }

        /**
         * Schedules a function to be executed with a canvas context.
         * 
         * @memberof shf2d.Entity
         * @param {function} f - The function.
         */
        schedule(f)
        {
            d.get(this).scheduledFunctions.push(f);
        }

        prepare(ctx)
        {
            d.get(this).scheduledFunctions.forEach((f) =>
            {
                f(ctx);
            });
            d.get(this).scheduledFunctions = [];
        }

        /**
         * Moves the entity by the given directional vector.
         * The vector is expected to be in the entity-local coordinate-system.
         * 
         * @memberof shf2d.Entity
         * @param {vec2} dv - The directional vector.
         */
        move(dv)
        {
            const priv = d.get(this);

            const rm = mat.rotationM(mat.vec(1, 0, 0), mat.vec(0, 1, 0), priv.rotationAngle);
            const xv = mat.mul(rm, mat.vec(dv.x, 0, 1));
            const yv = mat.mul(rm, mat.vec(0, dv.y, 1));

            const delta = mat.add(xv, yv);

            this.change("location", vec2(
                this.location.x + delta[0][0],
                this.location.y + delta[1][0]
            ));
        }

        fromWorld(worldLoc)
        {
            const matrices = [];
            let obj = this.parent;
            while (!! obj && !! obj.inverseMatrix)
            {
                matrices.push(obj.inverseMatrix);
                obj = obj.parent;
            }

            matrices.reverse();
            let loc = mat.vec(worldLoc.x, worldLoc.y, 1);

            matrices.forEach(m =>
            {
                loc = mat.mul(m, loc);
            });
            return this.vec2(loc[0][0] || 0, loc[1][0] || 0);
        }

        toWorld(loc)
        {
            const matrices = [];
            let obj = this.parent;
            while (!! obj && !! obj.matrix)
            {
                matrices.push(obj.matrix);
                obj = obj.parent;
            }

            let worldLoc = mat.vec(loc.x, loc.y, 1);

            matrices.forEach(m =>
            {
                worldLoc = mat.mul(m, worldLoc);
            });
            return this.vec2(worldLoc[0][0] || 0, worldLoc[1][0] || 0);

        }

        testCollision(collisions)
        {
            return collisions.indexOf(this) !== -1;
        }

        collisionsWith(v)
        {
            return [];
        }

        prepareScene(om, sceneInfo)
        {
            // no action by default
        }

        renderScene(ctx, om, sceneInfo)
        {
            // no action by default
        }
    };
});