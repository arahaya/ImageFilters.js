var ImageFilters = {};
ImageFilters.utils = {
    initSampleCanvas: function () {
        var _canvas = document.createElement('canvas'),
            _context = _canvas.getContext('2d');
        
        _canvas.width = 0;
        _canvas.height = 0;
        
        this.getSampleCanvas = function () {
            return _canvas;
        };
        this.getSampleContext = function () {
            return _context;
        };
        this.createImageData = (_context.createImageData) ? function (w, h) {
                return _context.createImageData(w, h);
            } : function (w, h) {
                return new ImageData(w, h);
            };
    },
    getSampleCanvas: function () {
        this.initSampleCanvas();
        return this.getSampleCanvas();
    },
    getSampleContext: function () {
        this.initSampleCanvas();
        return this.getSampleContext();
    },
    createImageData: function (w, h) {
        this.initSampleCanvas();
        return this.createImageData(w, h);
    },
    clamp: function (value) {
        return value > 255 ? 255 : value < 0 ? 0 : value;
    },
    buildMap: function (f) {
        for (var m = new Array(256), k = 0, v; k < 256;) {
            m[k] = (v = f(k++)) > 255 ? 255 : v < 0 ? 0 : v;
        }
        return m;
    },
    applyMap: function (src, dst, map) {
        for (var i = 0, l = src.length; i < l;) {
            dst[i] = map[src[i++]];
            dst[i] = map[src[i++]];
            dst[i] = map[src[i++]];
            dst[i] = src[i++];
        }
    },
    mapRGB: function (src, dst, func) {
        this.applyMap(src, dst, this.buildMap(func));
    },
    getPixelIndex: function (width, height, x, y, edge) {
        if (x < 0 || x >= width || y < 0 || y >= height) {
            switch (edge) {
            // clamp
            case 1:
                x = (x < 0) ? 0 : (x >= width) ? width - 1 : x;
                y = (y < 0) ? 0 : (y >= height) ? height - 1 : y;
                break;
            // wrap
            case 2:
                x = ((x %= width) < 0) ? x + width : x;
                y = ((y %= height) < 0) ? y + height : y;
                break;
            default:
                return null;
            }
        }
        return (y * width + x) * 4;
    },
    copyBilinear: function (src, width, height, x, y, dst, dstIndex, edge) {
        // TODO the wrap results are still weird.
        var floorX  = x | 0,
            floorY  = y | 0,
            weightX = x - floorX,
            weightY = y - floorY,
            nw, ne, sw, se;

        nw = this.getPixelIndex(width, height, floorX, floorY, edge);

        if (weightX === 0 && weightY === 0) {
            // no weight, just copy the top left pixel
            if (nw) {
                dst[dstIndex]   = src[nw];
                dst[++dstIndex] = src[++nw];
                dst[++dstIndex] = src[++nw];
                dst[++dstIndex] = src[++nw];
            }
            return;
        }

        ne = (weightX === 0) ? nw : this.getPixelIndex(width, height, floorX + 1, floorY, edge);
        sw = (weightY === 0) ? nw : this.getPixelIndex(width, height, floorX, floorY + 1, edge);
        se = (weightX === 0) ? sw : (weightY === 0) ? ne : this.getPixelIndex(width, height, floorX + 1, floorY + 1, edge);

        var r0 = 0, r1 = 0, r2 = 0, r3 = 0,
            g0 = 0, g1 = 0, g2 = 0, g3 = 0,
            b0 = 0, b1 = 0, b2 = 0, b3 = 0,
            a0 = 0, a1 = 0, a2 = 0, a3 = 0;

        if (nw !== null) {
            r0 = src[nw];
            g0 = src[++nw];
            b0 = src[++nw];
            a0 = src[++nw];
        }
        if (ne !== null) {
            r1 = src[ne];
            g1 = src[++ne];
            b1 = src[++ne];
            a1 = src[++ne];
        }
        if (sw !== null) {
            r2 = src[sw];
            g2 = src[++sw];
            b2 = src[++sw];
            a2 = src[++sw];
        }
        if (se !== null) {
            r3 = src[se];
            g3 = src[++se];
            b3 = src[++se];
            a3 = src[++se];
        }

        var cx = 1 - weightX,
            cy = 1 - weightY,
            r = cy * (cx * r0 + weightX * r1) + weightY * (cx * r2 + weightX * r3),
            g = cy * (cx * g0 + weightX * g1) + weightY * (cx * g2 + weightX * g3),
            b = cy * (cx * b0 + weightX * b1) + weightY * (cx * b2 + weightX * b3),
            a = cy * (cx * a0 + weightX * a1) + weightY * (cx * a2 + weightX * a3);

        dst[dstIndex]   = (r < 0) ? 0 : (r > 255) ? 255 : r + 0.5 | 0;
        dst[++dstIndex] = (g < 0) ? 0 : (g > 255) ? 255 : g + 0.5 | 0;
        dst[++dstIndex] = (b < 0) ? 0 : (b > 255) ? 255 : b + 0.5 | 0;
        dst[++dstIndex] = (a < 0) ? 0 : (a > 255) ? 255 : a + 0.5 | 0;
    },
    /**
     * @param r 0 <= n <= 255
     * @param g 0 <= n <= 255
     * @param b 0 <= n <= 255
     * @return Array(h, s, l)
     */
    rgbToHsl: function (r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

//        var max = Math.max(r, g, b),
//            min = Math.min(r, g, b),
        var max = (r > g) ? (r > b) ? r : b : (g > b) ? g : b,
            min = (r < g) ? (r < b) ? r : b : (g < b) ? g : b,
            chroma = max - min,
            h = 0,
            s = 0,
            // Lightness
            l = (min + max) / 2;

        if (chroma !== 0) {
            // Hue
            if (r === max) {
                h = (g - b) / chroma + ((g < b) ? 6 : 0);
            }
            else if (g === max) {
                h = (b - r) / chroma + 2;
            }
            else {
                h = (r - g) / chroma + 4;
            }
            h /= 6;

            // Saturation
            s = (l > 0.5) ? chroma / (2 - max - min) : chroma / (max + min);
        }

        return [h, s, l];
    },
    /**
     * @param h 0.0 <= n <= 1.0
     * @param s 0.0 <= n <= 1.0
     * @param l 0.0 <= n <= 1.0
     * @return Array(r, g, b)
     */
    hslToRgb: function (h, s, l) {
        var m1, m2, hue,
            r, g, b,
            rgb = [];

        if (s === 0) {
            r = g = b = l * 255 + 0.5 | 0;
            rgb = [r, g, b];
        }
        else {
            if (l <= 0.5) {
                m2 = l * (s + 1);
            }
            else {
                m2 = l + s - l * s;
            }

            m1 = l * 2 - m2;
            hue = h + 1 / 3;

            var tmp;
            for (var i = 0; i < 3; i++) {
                if (hue < 0) {
                    hue += 1;
                }
                else if (hue > 1) {
                    hue -= 1;
                }

                if (6 * hue < 1) {
                    tmp = m1 + (m2 - m1) * hue * 6;
                }
                else if (2 * hue < 1) {
                    tmp = m2;
                }
                else if (3 * hue < 2) {
                    tmp = m1 + (m2 - m1) * (2 / 3 - hue) * 6;
                }
                else {
                    tmp = m1;
                }

                rgb[i] = tmp * 255 + 0.5 | 0;

                hue -= 1 / 3;
            }
        }

        return rgb;
    }
};

ImageFilters.ConvolutionFilter = function (srcImageData, matrixX, matrixY, matrix, divisor, bias, preserveAlpha, clamp, color, alpha) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    divisor = divisor || 1;
    bias = bias || 0;

    // default true
    (preserveAlpha !== false) && (preserveAlpha = true);
    (clamp !== false) && (clamp = true);

    color = color || 0;
    alpha = alpha || 0;

    var index = 0,
        rows = matrixX >> 1,
        cols = matrixY >> 1,
        clampR = color >> 16 & 0xFF,
        clampG = color >>  8 & 0xFF,
        clampB = color       & 0xFF,
        clampA = alpha * 0xFF;

    for (var y = 0; y < srcHeight; ++y) {
        for (var x = 0; x < srcWidth; ++x) {
            var r = 0,
                g = 0,
                b = 0,
                a = 0,
                replace = false,
                mIndex = 0,
                v;

            for (var row = -rows; row <= rows; ++row) {
                var rowIndex = y + row,
                    offset;

                if (0 <= rowIndex && rowIndex < srcHeight) {
                    offset = rowIndex * srcWidth;
                }
                else if (clamp) {
                    offset = y * srcWidth;
                }
                else {
                    replace = true;
                }

                for (var col = -cols; col <= cols; ++col) {
                    var m = matrix[mIndex++];

                    if (m !== 0) {
                        var colIndex = x + col;

                        if (!(0 <= colIndex && colIndex < srcWidth)) {
                            if (clamp) {
                                colIndex = x;
                            }
                            else {
                                replace = true;
                            }
                        }

                        if (replace) {
                            r += m * clampR;
                            g += m * clampG;
                            b += m * clampB;
                            a += m * clampA;
                        }
                        else {
                            var p = (offset + colIndex) * 4;
                            r += m * srcPixels[p++];
                            g += m * srcPixels[p++];
                            b += m * srcPixels[p++];
                            a += m * srcPixels[p];
                        }
                    }
                }
            }

            dstPixels[index++] = (v = r / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
            dstPixels[index++] = (v = g / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
            dstPixels[index++] = (v = b / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
            dstPixels[index++] = preserveAlpha ? 255 : (v = a / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
        }
    }

    return dstImageData;
};

/**
 * @param threshold 0.0 <= n <= 1.0
 */
ImageFilters.Binarize = function (srcImageData, threshold) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    if (isNaN(threshold)) {
        threshold = 0.5;
    }

    threshold *= 255;

    for (var i = 0; i < srcLength;) {
        var avg = srcPixels[i] + srcPixels[i + 1] + srcPixels[i + 2] / 3;

        dstPixels[i++] = dstPixels[i++] = dstPixels[i++] = avg <= threshold ? 0 : 255;
        dstPixels[i++] = 255;
    }

    return dstImageData;
};

ImageFilters.BasicBlur = function (srcImageData) {
    return this.ConvolutionFilter(srcImageData, 3, 3, [
        0, 1, 0,
        1, 1, 1,
        0, 1, 0
    ], 5);
};

ImageFilters.BlendAdd = function (srcImageData, blendImageData, dx, dy) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data,
        blendPixels  = blendImageData.data;

    var v;

    for (var i = 0; i < srcLength; i++) {
        dstPixels[i] = ((v = srcPixels[i] + blendPixels[i++]) > 255) ? 255 : v;
        dstPixels[i] = ((v = srcPixels[i] + blendPixels[i++]) > 255) ? 255 : v;
        dstPixels[i] = ((v = srcPixels[i] + blendPixels[i++]) > 255) ? 255 : v;
        dstPixels[i] = 255;
    }

    return dstImageData;
};

ImageFilters.BlendSubtract = function (srcImageData, blendImageData, dx, dy) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data,
        blendPixels  = blendImageData.data;

    var v;

    for (var i = 0; i < srcLength; i++) {
        dstPixels[i] = ((v = srcPixels[i] - blendPixels[i++]) < 0) ? 0 : v;
        dstPixels[i] = ((v = srcPixels[i] - blendPixels[i++]) < 0) ? 0 : v;
        dstPixels[i] = ((v = srcPixels[i] - blendPixels[i++]) < 0) ? 0 : v;
        dstPixels[i] = 255;
    }

    return dstImageData;
};

ImageFilters.BoxBlur = function (srcImageData, hRadius, vRadius, quality) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.Clone(srcImageData), // clone the src
        dstPixels    = dstImageData.data,
        tmpImageData = this.utils.createImageData(srcWidth, srcHeight),
        tmpPixels    = tmpImageData.data;

    var blur = function (src, dst, width, height, radius) {
        var length = src.length;
        var widthMinus1 = width - 1;
        var tableSize = 2 * radius + 1;
        var srcIndex = 0;
        var dstIndex;
        var divide = [];
        var i, l, p, p2;

        for (i = 0, l = 256 * tableSize; i < l; ++i) {
            divide[i] = (i / tableSize) | 0;
        }

        for (var y = 0; y < height; ++y) {
            dstIndex = y;
            var ta = 0, tr = 0, tg = 0, tb = 0;

            for (i = -radius; i <= radius; ++i) {
                p = (srcIndex + ((i < 0) ? 0 : (i > widthMinus1) ? widthMinus1 : i)) * 4;
                tr += src[p];
                tg += src[++p];
                tb += src[++p];
                ta += src[++p];
            }

            for (var x = 0; x < width; ++x) {
                p = dstIndex * 4;
                dst[p]   = divide[tr];
                dst[++p] = divide[tg];
                dst[++p] = divide[tb];
                dst[++p] = divide[ta];

                var i1 = x + radius + 1;
                if (i1 > widthMinus1) {
                    i1 = widthMinus1;
                }
                var i2 = x - radius;
                if (i2 < 0) {
                    i2 = 0;
                }

                p  = (srcIndex + i1) * 4;
                p2 = (srcIndex + i2) * 4;

                tr += src[p]   - src[p2];
                tg += src[++p] - src[++p2];
                tb += src[++p] - src[++p2];
                ta += src[++p] - src[++p2];

                dstIndex += height;
            }
            srcIndex += width;
        }
    };

    while (quality--) {
        blur(dstPixels, tmpPixels, srcWidth, srcHeight, hRadius);
        blur(tmpPixels, dstPixels, srcHeight, srcWidth, vRadius);
    }

    return dstImageData;
};

/**
 * @ param strength 1 <= n <= 4
 */
ImageFilters.GaussianBlur = function (srcImageData, strength) {
    var size, matrix, divisor;

    switch (strength) {
    case 2:
        size = 5;
        matrix = [
            1, 1, 2, 1, 1,
            1, 2, 4, 2, 1,
            2, 4, 8, 4, 2,
            1, 2, 4, 2, 1,
            1, 1, 2, 1, 1
        ];
        divisor = 52;
        break;
    case 3:
        size = 7;
        matrix = [
            1, 1, 2,  2, 2, 1, 1,
            1, 2, 2,  4, 2, 2, 1,
            2, 2, 4,  8, 4, 2, 2,
            2, 4, 8, 16, 8, 4, 2,
            2, 2, 4,  8, 4, 2, 2,
            1, 2, 2,  4, 2, 2, 1,
            1, 1, 2,  2, 2, 1, 1
        ];
        divisor = 140;
        break;
    case 4:
        size = 15;
        matrix = [
            2 ,2 , 3 , 4 , 5 , 5 , 6 , 6 , 6 , 5 , 5 , 4 , 3 ,2 ,2,
            2 ,3 , 4 , 5 , 7 , 7 , 8 , 8 , 8 , 7 , 7 , 5 , 4 ,3 ,2,
            3 ,4 , 6 , 7 , 9 ,10 ,10 ,11 ,10 ,10 , 9 , 7 , 6 ,4 ,3,
            4 ,5 , 7 , 9 ,10 ,12 ,13 ,13 ,13 ,12 ,10 , 9 , 7 ,5 ,4,
            5 ,7 , 9 ,11 ,13 ,14 ,15 ,16 ,15 ,14 ,13 ,11 , 9 ,7 ,5,
            5 ,7 ,10 ,12 ,14 ,16 ,17 ,18 ,17 ,16 ,14 ,12 ,10 ,7 ,5,
            6 ,8 ,10 ,13 ,15 ,17 ,19 ,19 ,19 ,17 ,15 ,13 ,10 ,8 ,6,
            6 ,8 ,11 ,13 ,16 ,18 ,19 ,20 ,19 ,18 ,16 ,13 ,11 ,8 ,6,
            6 ,8 ,10 ,13 ,15 ,17 ,19 ,19 ,19 ,17 ,15 ,13 ,10 ,8 ,6,
            5 ,7 ,10 ,12 ,14 ,16 ,17 ,18 ,17 ,16 ,14 ,12 ,10 ,7 ,5,
            5 ,7 , 9 ,11 ,13 ,14 ,15 ,16 ,15 ,14 ,13 ,11 , 9 ,7 ,5,
            4 ,5 , 7 , 9 ,10 ,12 ,13 ,13 ,13 ,12 ,10 , 9 , 7 ,5 ,4,
            3 ,4 , 6 , 7 , 9 ,10 ,10 ,11 ,10 ,10 , 9 , 7 , 6 ,4 ,3,
            2 ,3 , 4 , 5 , 7 , 7 , 8 , 8 , 8 , 7 , 7 , 5 , 4 ,3 ,2,
            2 ,2 , 3 , 4 , 5 , 5 , 6 , 6 , 6 , 5 , 5 , 4 , 3 ,2 ,2
        ];
        divisor = 2044;
        break;
    default:
        size = 3;
        matrix = [
            1, 2, 1,
            2, 4, 2,
            1, 2, 1
        ];
        divisor = 16;
        break;
    }
    return this.ConvolutionFilter(srcImageData, size, size, matrix, divisor);
};

/**
 * TV based algorithm
 */
ImageFilters.Brightness = function (srcImageData, brightness) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    this.utils.mapRGB(srcPixels, dstPixels, function (value) {
        value += brightness;
        return (value > 255) ? 255 : value;
    });

    return dstImageData;
};

/**
 * GIMP algorithm modified. pretty close to fireworks
 * @param brightness -100 <= n <= 100
 * @param contrast -100 <= n <= 100
 */
ImageFilters.BrightnessContrastGimp = function (srcImageData, brightness, contrast) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data,
        p4           = Math.PI / 4;

    // fix to -1 <= n <= 1
    brightness /= 100;
    
    // fix to -99 <= n <= 99
    contrast *= 0.99;
    // fix to -1 < n < 1
    contrast /= 100;
    // apply GIMP formula
    contrast = Math.tan((contrast + 1) * p4);

    // get the average color
    for (var avg = 0, i = 0; i < srcLength; ++i) {
        avg += (srcPixels[i++] * 19595 + srcPixels[i++] * 38470 + srcPixels[i++] * 7471) >> 16;
    }
    avg = avg / (srcLength / 4);

    this.utils.mapRGB(srcPixels, dstPixels, function (value) {
        if (brightness < 0) {
            value = value * (1 + brightness);
        } else if (brightness > 0) {
            value = value + ((255 - value) * brightness);
        }
        //value += brightness;

        if (contrast !== 0) {
            value = (value - avg) * contrast + avg;
        }
        return value + 0.5 | 0;
    });
    return dstImageData;
};

/**
 * more like the new photoshop algorithm
 * @param brightness -100 <= n <= 100
 * @param contrast -100 <= n <= 100
 */
ImageFilters.BrightnessContrastPhotoshop = function (srcImageData, brightness, contrast) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    // fix to 0 <= n <= 2;
    brightness = (brightness + 100) / 100;
    contrast = (contrast + 100) / 100;

    this.utils.mapRGB(srcPixels, dstPixels, function (value) {
        value *= brightness;
        value = (value - 127.5) * contrast + 127.5;
        return value + 0.5 | 0;
    });
    return dstImageData;
};

ImageFilters.Channels = function (srcImageData, channel) {
    var matrix;

    switch (channel) {
        case 2: // green
            matrix = [
                0, 1, 0, 0, 0,
                0, 1, 0, 0, 0,
                0, 1, 0, 0, 0,
                0, 0, 0, 1, 0
            ];
            break;
        case 3: // blue
            matrix = [
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 1, 0
            ];
            break;
        default: // red
            matrix = [
                1, 0, 0, 0, 0,
                1, 0, 0, 0, 0,
                1, 0, 0, 0, 0,
                0, 0, 0, 1, 0
            ];
            break;

    }

    return this.ColorMatrixFilter(srcImageData, matrix);
};

ImageFilters.Clone = function (srcImageData) {
    return this.Copy(srcImageData, this.utils.createImageData(srcImageData.width, srcImageData.height));
};

ImageFilters.ColorMatrixFilter = function (srcImageData, matrix) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    var m0  = matrix[0],
        m1  = matrix[1],
        m2  = matrix[2],
        m3  = matrix[3],
        m4  = matrix[4],
        m5  = matrix[5],
        m6  = matrix[6],
        m7  = matrix[7],
        m8  = matrix[8],
        m9  = matrix[9],
        m10 = matrix[10],
        m11 = matrix[11],
        m12 = matrix[12],
        m13 = matrix[13],
        m14 = matrix[14],
        m15 = matrix[15],
        m16 = matrix[16],
        m17 = matrix[17],
        m18 = matrix[18],
        m19 = matrix[19];

    var value, i = 0, r, g, b, a;
    while (i < srcLength) {
        r = srcPixels[i];
        g = srcPixels[i + 1];
        b = srcPixels[i + 2];
        a = srcPixels[i + 3];

        dstPixels[i++] = (value = r *  m0 + g *  m1 + b *  m2 + a *  m3 +  m4) > 255 ? 255 : value < 0 ? 0 : value | 0;
        dstPixels[i++] = (value = r *  m5 + g *  m6 + b *  m7 + a *  m8 +  m9) > 255 ? 255 : value < 0 ? 0 : value | 0;
        dstPixels[i++] = (value = r * m10 + g * m11 + b * m12 + a * m13 + m14) > 255 ? 255 : value < 0 ? 0 : value | 0;
        dstPixels[i++] = (value = r * m15 + g * m16 + b * m17 + a * m18 + m19) > 255 ? 255 : value < 0 ? 0 : value | 0;
    }

    return dstImageData;
};

ImageFilters.ColorTransformFilter = function (
        srcImageData, redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier,
        redOffset, greenOffset, blueOffset, alphaOffset) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    var i = 0, v;
    for (; i < srcLength;) {
        dstPixels[i] = (v = srcPixels[i++] * redMultiplier   + redOffset)   > 255 ? 255 : v < 0 ? 0 : v;
        dstPixels[i] = (v = srcPixels[i++] * greenMultiplier + greenOffset) > 255 ? 255 : v < 0 ? 0 : v;
        dstPixels[i] = (v = srcPixels[i++] * blueMultiplier  + blueOffset)  > 255 ? 255 : v < 0 ? 0 : v;
        dstPixels[i] = (v = srcPixels[i++] * alphaMultiplier + alphaOffset) > 255 ? 255 : v < 0 ? 0 : v;
    }

    return dstImageData;
};

ImageFilters.Copy = function (srcImageData, dstImageData) {
    var srcPixels = srcImageData.data,
        srcLength = srcPixels.length,
        dstPixels = dstImageData.data;

    while (srcLength--) {
        dstPixels[srcLength] = srcPixels[srcLength];
    }

    return dstImageData;
};

ImageFilters.Crop = function (srcImageData, x, y, width, height) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(width, height),
        dstPixels    = dstImageData.data;

    var srcLeft   = Math.max(x, 0);
    var srcTop    = Math.max(y, 0);
    var srcRight  = Math.min(x + width, srcWidth);
    var srcBottom = Math.min(y + height, srcHeight);
    var dstLeft   = srcLeft - x;
    var dstTop    = srcTop - y;

    for (var srcRow = srcTop, dstRow = dstTop; srcRow < srcBottom; ++srcRow, ++dstRow) {
        for (var srcCol = srcLeft, dstCol = dstLeft; srcCol < srcRight; ++srcCol, ++dstCol) {
            var srcIndex = (srcRow * srcWidth * 4) + (srcCol * 4);
            var dstIndex = (dstRow * width * 4) + (dstCol * 4);
            dstPixels[dstIndex]   = srcPixels[srcIndex];
            dstPixels[++dstIndex] = srcPixels[++srcIndex];
            dstPixels[++dstIndex] = srcPixels[++srcIndex];
            dstPixels[++dstIndex] = srcPixels[++srcIndex];
        }
    }

    return dstImageData;
};

ImageFilters.CropBuiltin = function (srcImageData, x, y, width, height) {
    var srcWidth  = srcImageData.width,
        srcHeight = srcImageData.height,
        canvas    = this.utils.getSampleCanvas(),
        context   = this.utils.getSampleContext();

    canvas.width = srcWidth;
    canvas.height = srcHeight;
    context.putImageData(srcImageData, 0, 0);
    var result = context.getImageData(x, y, width, height);

    canvas.width = 0;
    canvas.height = 0;

    return result;
};

/**
 * sets to the average of the highest and lowest contrast
 */
ImageFilters.Desaturate = function (srcImageData) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    for (var i = 0; i < srcLength;) {
        var r = srcPixels[i],
            g = srcPixels[i + 1],
            b = srcPixels[i + 2],
            max = (r > g) ? (r > b) ? r : b : (g > b) ? g : b,
            min = (r < g) ? (r < b) ? r : b : (g < b) ? g : b,
            avg = ((max + min) / 2) + 0.5 | 0;

        dstPixels[i++] = dstPixels[i++] = dstPixels[i++] = avg;
        dstPixels[i] = srcPixels[i++];
    }

    return dstImageData;
};

/**
 * TODO: use bilinear
 */
ImageFilters.DisplacementMapFilter = function (srcImageData, mapImageData, mapX, mapY, componentX, componentY, scaleX, scaleY, mode) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
//        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstImageData = ImageFilters.Clone(srcImageData),
        dstPixels    = dstImageData.data;

    mapX || (mapX = 0);
    mapY || (mapY = 0);
    componentX || (componentX = 0); // red?
    componentY || (componentY = 0);
    scaleX || (scaleX = 0);
    scaleY || (scaleY = 0);
    mode || (mode = 2); // wrap

    var mapWidth  = mapImageData.width,
        mapHeight = mapImageData.height,
        mapPixels = mapImageData.data,
        mapRight  = mapWidth + mapX,
        mapBottom = mapHeight + mapY,
        dstIndex, srcIndex, mapIndex,
        cx, cy, tx, ty, x, y;

    for (x = 0; x < srcWidth; ++x) {
        for (y = 0; y < srcHeight; ++y) {

            dstIndex = (y * srcWidth + x) * 4;

            if (x < mapX || y < mapY || x >= mapRight || y >= mapBottom) {
                // out of the map bounds
                // copy src to dst
                srcIndex = dstIndex;
            } else {
                // apply map
                mapIndex = ((y - mapY) * mapWidth + (x - mapX)) * 4;

                // tx = x + ((componentX(x, y) - 128) * scaleX) / 256
                cx = mapPixels[mapIndex + componentX];
                tx = x + ((cx - 128) * scaleX) / 256;

                // tx = y + ((componentY(x, y) - 128) * scaleY) / 256
                cy = mapPixels[mapIndex + componentY];
                ty = y + ((cy - 128) * scaleY) / 256;

                //copyBilinear: function (src, width, height, x, y, dst, dstIndex, edge) {
                //ImageFilters.utils.copyBilinear(srcPixels, srcWidth, srcHeight, tx, ty, dstPixels, dstIndex, mode)

                srcIndex = ImageFilters.utils.getPixelIndex(srcWidth, srcHeight, tx + 0.5 | 0, ty + 0.5 | 0, mode);
                if (srcIndex === null) {
                    // if mode == ignore and (tx,ty) is out of src bounds
                    // then copy (x,y) to dst
                    srcIndex = dstIndex;
                }
            }

            dstPixels[dstIndex++] = srcPixels[srcIndex++];
            dstPixels[dstIndex++] = srcPixels[srcIndex++];
            dstPixels[dstIndex++] = srcPixels[srcIndex++];
            dstPixels[dstIndex]   = srcPixels[srcIndex];
        }
    }

    return dstImageData;
};

ImageFilters.Edge = function (srcImageData) {
    //pretty close to Fireworks 'Find Edges' effect
    return this.ConvolutionFilter(srcImageData, 3, 3, [
        -1, -1, -1,
        -1,  8, -1,
        -1, -1, -1
    ]);
};

ImageFilters.Emboss = function (srcImageData) {
    return this.ConvolutionFilter(srcImageData, 3, 3, [
        -2, -1, 0,
        -1,  1, 1,
         0,  1, 2
    ]);
};

ImageFilters.Enrich = function (srcImageData) {
    return this.ConvolutionFilter(srcImageData, 3, 3, [
         0, -2,  0,
        -2, 20, -2,
         0, -2,  0
    ], 10, -40);
};

ImageFilters.Flip = function (srcImageData, vertical) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    var x, y, srcIndex, dstIndex, i;

    for (y = 0; y < srcHeight; y++) {
        for (x = 0; x < srcWidth; x++) {
            srcIndex = (y * srcWidth + x) * 4;
            if (vertical) {
                dstIndex = ((srcHeight - y - 1) * srcWidth + x) * 4;
            }
            else {
                dstIndex = (y * srcWidth + (srcWidth - x - 1)) * 4;
            }

            dstPixels[dstIndex++] = srcPixels[srcIndex++];
            dstPixels[dstIndex++] = srcPixels[srcIndex++];
            dstPixels[dstIndex++] = srcPixels[srcIndex++];
            dstPixels[dstIndex]   = srcPixels[srcIndex];
        }
    }

    return dstImageData;
};

ImageFilters.Gamma = function (srcImageData, gamma) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    this.utils.mapRGB(srcPixels, dstPixels, function (value) {
        value = (255 * Math.pow(value / 255, 1 / gamma) + 0.5);
        return value > 255 ? 255 : value + 0.5 | 0;
    });

    return dstImageData;
};

ImageFilters.GrayScale = function (srcImageData) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    for (var i = 0; i < srcLength;) {
        var intensity = (srcPixels[i] * 19595 + srcPixels[i + 1] * 38470 + srcPixels[i + 2] * 7471) >> 16;
        dstPixels[i++] = dstPixels[i++] = dstPixels[i++] = intensity;
        dstPixels[i] = srcPixels[i++];
    }

    return dstImageData;
};

/**
 * @param hueDelta  -180 <= n <= 180
 * @param satDelta  -100 <= n <= 100
 * @param lightness -100 <= n <= 100
 */
ImageFilters.HSLAdjustment = function (srcImageData, hueDelta, satDelta, lightness) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    hueDelta /= 360;
    satDelta /= 100;
    lightness /= 100;

    var rgbToHsl = this.utils.rgbToHsl;
    var hslToRgb = this.utils.hslToRgb;
    var h, s, l, hsl, rgb, i = 0;

    while (i < srcLength) {
        // convert to HSL
        hsl = rgbToHsl(srcPixels[i], srcPixels[i + 1], srcPixels[i + 2]);

        // hue
        h = hsl[0] + hueDelta;
        while (h < 0) {
            h += 1;
        }
        while (h > 1) {
            h -= 1;
        }

        // saturation
        s = hsl[1] + hsl[1] * satDelta;
        if (s < 0) {
            s = 0;
        }
        else if (s > 1) {
            s = 1;
        }

        // lightness
        l = hsl[2];
        if (lightness > 0) {
            l += (1 - l) * lightness;
        }
        else if (lightness < 0) {
            l += l * lightness;
        }

        // convert back to rgb
        rgb = hslToRgb(h, s, l);

        dstPixels[i++] = rgb[0];
        dstPixels[i++] = rgb[1];
        dstPixels[i++] = rgb[2];
        dstPixels[i]   = srcPixels[i++];
    }

    return dstImageData;
};

ImageFilters.Invert = function (srcImageData) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    this.utils.mapRGB(srcPixels, dstPixels, function (value) {
        return 255 - value;
    });

    return dstImageData;
};

ImageFilters.Mosaic = function (srcImageData, blockSize) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;
    
    var cols = Math.ceil(srcWidth / blockSize);
    var rows = Math.ceil(srcHeight / blockSize);

    for (var col = 0; col < cols; ++col) {
        for (var row = 0; row < rows; ++row) {
            var x1 = col * blockSize;
            var y1 = row * blockSize;
            var x2 = x1  + blockSize;
            var y2 = y1  + blockSize;

            if (x2 > srcWidth) {
                x2 = srcWidth;
            }

            if (y2 > srcHeight) {
                y2 = srcHeight;
            }

            var x, y, index;

            //get the average color from the src
            var r = 0;
            var g = 0;
            var b = 0;
            //var a = 0;
            var size = (x2 - x1) * (y2 - y1);

            for (x = x1; x < x2; ++x) {
                for (y = y1; y < y2; ++y) {
                    index = (y * srcWidth * 4) + (x * 4);
                    r += srcPixels[index++];
                    g += srcPixels[index++];
                    b += srcPixels[index++];
                    //a += srcPixels[index];
                }
            }

            r = (r / size + 0.5) | 0;
            g = (g / size + 0.5) | 0;
            b = (b / size + 0.5) | 0;
            //a = (a / size + 0.5) | 0;

            //fill the dst with that color
            for (x = x1; x < x2; ++x) {
                for (y = y1; y < y2; ++y) {
                    index = (y * srcWidth * 4) + (x * 4);
                    dstPixels[index++] = r;
                    dstPixels[index++] = g;
                    dstPixels[index++] = b;
                    //dstPixels[index]   = a;
                    dstPixels[index]   = 255;
                }
            }
        }
    }

    return dstImageData;
};

ImageFilters.OpacityFilter = function (srcImageData, opacity) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    for (var i = 0; i < srcLength;) {
        dstPixels[i] = srcPixels[i++];
        dstPixels[i] = srcPixels[i++];
        dstPixels[i] = srcPixels[i++];
        dstPixels[i++] = opacity;
    }

    return dstImageData;
};

/**
 * @param levels 2 <= n <= 255
 */
ImageFilters.Posterize = function (srcImageData, levels) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    levels = levels < 2 ? 2 : levels > 255 ? 255 : levels;

    var map = [];

    for (var i = 0; i < levels; i++) {
        map[i] = ((255 * i) / (levels - 1)) & 0xFF;
    }

    var j = 0,
        k = 0;

    this.utils.mapRGB(srcPixels, dstPixels, function (value) {
        var ret = map[j];

        k += levels;

        if (k > 255) {
            k -= 255;
            j++;
        }

        return ret;
    });

    return dstImageData;
};

/**
 * @param scale 0.0 <= n <= 5.0
 */
ImageFilters.Rescale = function (srcImageData, scale) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    this.utils.mapRGB(srcPixels, dstPixels, function (value) {
        value *= scale;
        return (value > 255) ? 255 : value + 0.5 | 0;
    });

    return dstImageData;
};

/**
 * Nearest neighbor
 */
ImageFilters.ResizeNearestNeighbor = function (srcImageData, width, height) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(width, height),
        dstPixels    = dstImageData.data;

    var xFactor = srcWidth / width;
    var yFactor = srcHeight / height;
    var dstIndex = 0;

    for (var y = 0; y < height; ++y) {
        var srcY = (y * yFactor) | 0;

        for (var x = 0; x < width; ++x) {
            var srcX = (x * xFactor) | 0;
            var srcIndex = (srcY * srcWidth * 4) + (srcX * 4);

            dstPixels[dstIndex++] = srcPixels[srcIndex++];
            dstPixels[dstIndex++] = srcPixels[srcIndex++];
            dstPixels[dstIndex++] = srcPixels[srcIndex++];
            dstPixels[dstIndex++] = srcPixels[srcIndex];
        }
    }

    return dstImageData;
};

/**
 * Bilinear
 */
ImageFilters.Resize = function (srcImageData, width, height) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(width, height),
        dstPixels    = dstImageData.data;

    var xFactor = srcWidth / width;
    var yFactor = srcHeight / height;
    var dstIndex = 0;

    for (var y = 1; y <= height; ++y) {
        for (var x = 1; x <= width; ++x) {
            this.utils.copyBilinear(srcPixels, srcWidth, srcHeight, x * xFactor - 1, y * yFactor - 1, dstPixels, dstIndex, 0);
            dstIndex += 4;
        }
    }

    return dstImageData;
};


/**
 * faster resizing using the builtin context.scale()
 * the resizing algorithm may be different between browsers
 * this might not work if the image is transparent.
 * to fix that we probably need two contexts
 */
ImageFilters.ResizeBuiltin = function (srcImageData, width, height) {
    var srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        canvas    = this.utils.getSampleCanvas(),
        context   = this.utils.getSampleContext();;

    canvas.width  = Math.max(srcWidth, width);
    canvas.height = Math.max(srcHeight, height);
    context.save();

    context.putImageData(srcImageData, 0, 0);
    context.scale(width / srcWidth, height / srcHeight);
    context.drawImage(canvas, 0, 0);

    var result = context.getImageData(0, 0, width, height);

    context.restore();
    canvas.width = 0;
    canvas.height = 0;

    return result;
};

ImageFilters.Sepia = function (srcImageData) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    var r, g, b, i, value;

    for (i = 0; i < srcLength;) {
        r = srcPixels[i];
        g = srcPixels[i + 1];
        b = srcPixels[i + 2];

        dstPixels[i++] = (value = r * 0.393 + g * 0.769 + b * 0.189) > 255 ? 255 : value < 0 ? 0 : value + 0.5 | 0;
        dstPixels[i++] = (value = r * 0.349 + g * 0.686 + b * 0.168) > 255 ? 255 : value < 0 ? 0 : value + 0.5 | 0;
        dstPixels[i++] = (value = r * 0.272 + g * 0.534 + b * 0.131) > 255 ? 255 : value < 0 ? 0 : value + 0.5 | 0;
        //dstPixels[i++] = this.utils.clamp((r * 0.393 + g * 0.769 + b * 0.189) + 0.5 | 0);
        //dstPixels[i++] = this.utils.clamp((r * 0.349 + g * 0.686 + b * 0.168) + 0.5 | 0);
        //dstPixels[i++] = this.utils.clamp((r * 0.272 + g * 0.534 + b * 0.131) + 0.5 | 0);
        dstPixels[i]   = srcPixels[i++];
    }

    return dstImageData;
};

/**
 * @param factor 1 <= n
 */
ImageFilters.Sharpen = function (srcImageData, factor) {
    //Convolution formula from VIGRA
    return this.ConvolutionFilter(srcImageData, 3, 3, [
        -factor/16,     -factor/8,      -factor/16,
        -factor/8,       factor*0.75+1, -factor/8,
        -factor/16,     -factor/8,      -factor/16
    ]);
};

ImageFilters.Solarize = function (srcImageData) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    this.utils.mapRGB(srcPixels, dstPixels, function (value) {
        return value > 127 ? (value - 127.5) * 2 : (127.5 - value) * 2;
    });

    return dstImageData;
};

ImageFilters.Transpose = function (srcImageData) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcHeight, srcWidth),
        dstPixels    = dstImageData.data;
    
    var srcIndex, dstIndex;
    
    for (y = 0; y < srcHeight; ++y) {
        for (x = 0; x < srcWidth; ++x) {
            srcIndex = (y * srcWidth + x) * 4;
            dstIndex = (x * srcHeight + y) * 4;

            dstPixels[dstIndex]   = srcPixels[srcIndex];
            dstPixels[++dstIndex] = srcPixels[++srcIndex];
            dstPixels[++dstIndex] = srcPixels[++srcIndex];
            dstPixels[++dstIndex] = srcPixels[++srcIndex];
        }
    }
    
    return dstImageData;
};

/**
 * @param centerX 0.0 <= n <= 1.0
 * @param centerY 0.0 <= n <= 1.0
 * @param radius
 * @param angle(degree)
 * @param smooth
 */
ImageFilters.Twril = function (srcImageData, centerX, centerY, radius, angle, edge, smooth) {
    var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

    //convert position to px
    centerX = srcWidth  * centerX;
    centerY = srcHeight * centerY;

    // degree to radian
    angle *= (Math.PI / 180);

    var radius2 = radius * radius;
    var x, y, dx, dy, distance, a, tx, ty, srcIndex, dstIndex, pixel, i;

    var max_y = srcHeight - 1;
    var max_x = srcWidth - 1;

    for (y = 0; y < srcHeight; y++) {
        for (x = 0; x < srcWidth; x++) {
            dx = x - centerX;
            dy = y - centerY;
            distance = dx * dx + dy * dy;
            dstIndex = (y * srcWidth + x) * 4;

            if (distance > radius2) {
                // out of the effected area. just copy the pixel
                for (i = 0; i < 4;) {
                    dstPixels[dstIndex + i] = srcPixels[dstIndex + i++];
                }
            }
            else {
                // main formula
                distance = Math.sqrt(distance);

                //float a = (float)Math.atan2(dy, dx) + (angle * (radius - distance)) / radius;

                a  = Math.atan2(dy, dx) + (angle * (radius - distance)) / radius;
                tx = centerX + distance * Math.cos(a);
                ty = centerY + distance * Math.sin(a);

                // copy target pixel
                if (smooth) {
                    // bilinear
                    this.utils.copyBilinear(srcPixels, srcWidth, srcHeight, tx, ty, dstPixels, dstIndex, edge);
                }
                else {
                    // nearest neighbor
                    // round tx, ty
                    srcIndex = ((ty + 0.5 | 0) * srcWidth * 4) + ((tx + 0.5 | 0) * 4);
                    for (i = 0; i < 4;) {
                        dstPixels[dstIndex + i] = srcPixels[srcIndex + i++];
                    }
                }
            }
        }
    }

    return dstImageData;
};

ImageFilters.UnsharpMaskFilter = function (srcImageData, level) {
    // ...
};
