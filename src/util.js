export let Util = {
    isCoordInRect: function (coord, rectCenter, rectWidth, rectHeight) {
        return (coord.x < rectCenter.x + (rectWidth / 2) && coord.x > rectCenter.x - (rectWidth / 2)) && (coord.y < rectCenter.y + (rectHeight / 2) && coord.y > rectCenter.y - (rectHeight / 2));
    },
    intersectCircles: function (p1, r1, p2, r2) {
        let dx = p1.x - p2.x;
        let dy = p1.y - p2.y;
        // console.log(Math.pow(r1 + r2, 2), dx * dx + dy * dy);
        return Math.pow(r1 + r2, 2) >= dx * dx + dy * dy;
    },
    intersectCircleSquare: function (c, r, p, w, h) {
        return this.isCoordInRect(c, p, w + 2 * r, h + 2 * r);
    },
    intersectCirclePill: function (c, r, p, w, h) {
        if (w === h) return this.intersectCircles(c, r, p, w / 2);
        if (w > h) {
            let pr = h / 2;
            return this.intersectCircleSquare(c, r, p, w - pr * 2, h) || this.intersectCircles(c, r, new Two.Vector(p.x - (w / 2) + pr, p.y), pr) || this.intersectCircles(c, r, new Two.Vector(p.x + (w / 2) - pr, p.y), pr);
        } else {
            let pr = w / 2;
            return this.intersectCircleSquare(c, r, p, w, h - pr * 2) || this.intersectCircles(c, r, new Two.Vector(p.x, p.y - (h / 2) + pr), pr) || this.intersectCircles(c, r, new Two.Vector(p.x, p.y + (h / 2) - pr), pr);
        }
    },
    vectorSet: function (setee, setter) {
        setee.set(setter.x, setter.y);
    },
    getRandomTargetPosition(width, height) {
        let x = Math.random() * (width / 2) + (width / 2);
        let y = Math.random() * (height);
        return new Two.Vector(x, y);
    },
    interpColor(c1, c2, step, totalSteps) {
        let resultArray = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            resultArray[i] = (c2[i] - c1[i]) * (step / totalSteps) + c1[i];
        }
        return resultArray;
    },
    linearInterp(n1, n2, step, totalSteps) {
        return (n2 - n1) * (step / totalSteps) + n1;
    },
    lightenColor(c) {
        let hsv = this.RGB_HSV(c[0], c[1], c[2]);
        hsv.s = hsv.s / 2;
        hsv.v = Math.pow(hsv.v, 0.1);
        let rgb = this.HSV_RGB(hsv);
        return this.arrayToRGB(rgb);
    },
    arrayToRGB(c) {
        if (!c.length)
            return "rgb(" + c.r + ", " + c.g + ", " + c.b + ")";
        else
            return "rgb(" + c[0] + ", " + c[1] + ", " + c[2] + ")";
    },
    RGB_HSV(r, g, b) {
        if (arguments.length === 1) {
            g = r.g, b = r.b, r = r.r;
        }
        var max = Math.max(r, g, b), min = Math.min(r, g, b),
            d = max - min,
            h,
            s = (max === 0 ? 0 : d / max),
            v = max / 255;

        switch (max) {
            case min: h = 0; break;
            case r: h = (g - b) + d * (g < b ? 6 : 0); h /= 6 * d; break;
            case g: h = (b - r) + d * 2; h /= 6 * d; break;
            case b: h = (r - g) + d * 4; h /= 6 * d; break;
        }

        return {
            h: h,
            s: s,
            v: v
        };
    },
    HSV_RGB(h, s, v) {
        let r, g, b, i, f, p, q, t;
        if (arguments.length === 1) {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
};