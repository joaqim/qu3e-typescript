"use strict";
exports.__esModule = true;
exports.Collide = void 0;
var gl_matrix_1 = require("gl-matrix");
require("./math/vec3");
function Transpose(m) {
    return [
        m[0], m[3], m[6],
        m[1], m[4], m[7],
        m[2], m[5], m[8],
    ];
}
function Multiply(m, v) {
    return [
        m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
        m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
        m[2] * v[0] + m[5] * v[1] + m[8] * v[2]
    ];
}
function MulT(r, v) {
    return Multiply(Transpose(r), v);
}
function Abs(v) {
    return [Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2])];
}
function CreateMatrix(x, y, z) {
    return [
        x[0], y[0], z[0],
        x[1], y[1], z[1],
        x[2], y[2], z[2],
    ];
}
var Collide = /** @class */ (function () {
    function Collide() {
    }
    Collide.TrackFaceAxis = function (axis, n, s, sMax, normal, axisNormal) {
        var result = false;
        if (s > 0) {
            result = true;
        }
        else if (s > sMax) {
            sMax = s;
            axis = n;
            axisNormal = normal;
        }
        return {
            axis: axis,
            axisNormal: axisNormal,
            sMax: sMax,
            result: result
        };
    };
    Collide.TrackEdgeAxis = function (axis, n, s, sMax, normal, axisNormal) {
        var result = false;
        if (s > 0) {
            result = true;
        }
        else {
            var l = 1 / gl_matrix_1.vec3.length(normal);
            s *= l;
            if (s > sMax) {
                sMax = s;
                axis = n;
                //TODO: Find existing  vec multiply by number util function
                axisNormal[0] = normal[0] * l;
                axisNormal[1] = normal[1] * l;
                axisNormal[2] = normal[2] * l;
            }
        }
        return {
            axis: axis,
            axisNormal: axisNormal,
            sMax: sMax,
            result: result
        };
    };
    Collide.ComputeReferenceEdgesAndBasis = function (eR, rtx, n, axis) {
        var result = [0, 0, 0, 0];
        var basis = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        var e;
        var n = MulT(rtx.rotation, n);
        if (axis >= 3)
            axis -= 3;
        switch (axis) {
            case 0:
                if (n[0] > 0) {
                    result[0] = 1;
                    result[1] = 8;
                    result[2] = 7;
                    result[3] = 9;
                    e = [eR[1], eR[2], eR[0]];
                    basis = [
                        rtx.rotation[6], rtx.rotation[7], rtx.rotation[8],
                        rtx.rotation[3], rtx.rotation[4], rtx.rotation[5],
                        -rtx.rotation[0], -rtx.rotation[1], -rtx.rotation[2]
                    ];
                }
                else {
                    result[0] = 11;
                    result[1] = 3;
                    result[2] = 10;
                    result[3] = 5;
                    e = [eR[2], eR[1], eR[0]];
                    basis = [
                        rtx.rotation[3], rtx.rotation[4], rtx.rotation[5],
                        rtx.rotation[6], rtx.rotation[7], rtx.rotation[8],
                        -rtx.rotation[0], -rtx.rotation[1], -rtx.rotation[2]
                    ];
                }
            case 1:
                if (n[2] > 0) {
                    result[0] = 0;
                    result[1] = 1;
                    result[2] = 2;
                    result[3] = 3;
                    e = [eR[2], eR[0], eR[1]];
                    basis = [
                        rtx.rotation[3], rtx.rotation[4], rtx.rotation[5],
                        rtx.rotation[0], rtx.rotation[1], rtx.rotation[2],
                        rtx.rotation[6], rtx.rotation[7], rtx.rotation[8]
                    ];
                }
                else {
                    result[0] = 4;
                    result[1] = 5;
                    result[2] = 6;
                    result[3] = 7;
                    e = [eR[2], eR[0], eR[1]];
                    basis = [
                        rtx.rotation[3], rtx.rotation[4], rtx.rotation[5],
                        -rtx.rotation[0], -rtx.rotation[1], -rtx.rotation[2],
                        -rtx.rotation[6], -rtx.rotation[7], -rtx.rotation[8]
                    ];
                }
            case 2:
                if (n[2] > 0) {
                    result[0] = 11;
                    result[1] = 4;
                    result[2] = 8;
                    result[3] = 0;
                    e = [eR[1], eR[0], eR[2]];
                    basis = [
                        -rtx.rotation[3], -rtx.rotation[4], -rtx.rotation[5],
                        rtx.rotation[0], rtx.rotation[1], rtx.rotation[2],
                        rtx.rotation[6], rtx.rotation[7], rtx.rotation[8]
                    ];
                }
                else {
                    result[0] = 6;
                    result[1] = 10;
                    result[2] = 2;
                    result[3] = 9;
                    e = [eR[1], eR[0], eR[2]];
                    basis = [
                        -rtx.rotation[3], -rtx.rotation[4], -rtx.rotation[5],
                        -rtx.rotation[0], -rtx.rotation[1], -rtx.rotation[2],
                        -rtx.rotation[6], -rtx.rotation[7], -rtx.rotation[8]
                    ];
                }
        }
        return {
            basis: basis,
            result: result
        };
    };
    Collide.ComputeIncidentFaces = function (itx, e, n, result) {
        var mt = MulT(itx.rotation, n);
        n = [-mt[0], -mt[1], -mt[2]];
        //var absN: vec3 = Abs(n);
        var absN = gl_matrix_1.vec3.abs(n);
    };
    return Collide;
}());
exports.Collide = Collide;
