import { Image } from '../image';
import { WHITE, BLACK, RED, GREEN, BLUE, Color } from '../color';
import { ESTALE } from 'node:constants';


export function contour(image : (x : number, y : number) => Color) : (x : number, y : number) => Color {

    function contourAux(x : number, y : number) : Color {
    if (image(x - 1, y) != image(x, y) && image(x - 1, y) != BLACK)
        return BLACK;
    if (image(x + 1, y) != image(x, y) && image(x + 1, y) != BLACK)
        return BLACK;
    if (image(x, y + 1) != image(x, y) && image(x, y + 1) != BLACK)
        return BLACK;
    if (image(x, y - 1) != image(x, y) && image(x, y - 1) != BLACK)
        return BLACK;
    return image(x, y)
    }
    return contourAux;
}

//pavages réguliers
export function pavageCarréGen(width : number, height : number, nbOfPatterns: number, color1: Color, color2: Color): Image {
    function pavageInt(x: number, y: number): Color {
        let scale = width/nbOfPatterns;
        scale = Math.trunc(scale);
        if (x % scale == 0 || y % scale == 0)
            return BLACK;
        return (x % (2 * scale) < scale) !== (y % (2 * scale) < scale) ? color1 : color2;
    }
    return {width, height, function : contour(pavageInt)};
}

export function pavageTriangleGen(width : number, height : number, nbOfPatterns: number, color1: Color, color2: Color): Image {
    function pavageInt(x: number, y: number): Color {
        let scale = width/nbOfPatterns;
        x = x % scale; //we use the symmetries of the pavage : x and y are transposed in a (scale x scale*sin(pi/3)) rectangle
        if (x > scale / 2)
            x = scale - x;
        y = y % (2 * scale * Math.sin((Math.PI) / 3));
        if (y > scale * Math.sin((Math.PI) / 3)) {
            if (x == 0)
                return color1;
            y = 2 * scale * Math.sin((Math.PI) / 3) - y;
            if ((y / x) < (2 * Math.sin((Math.PI) / 3)))
                return color2;
            else
                return color1;
        }
        if (x == 0)
            return color2;
        if ((y / x) < (2 * Math.sin((Math.PI) / 3)))
            return color1;
        else
            return color2;
    }
    return {width, height, function : contour(pavageInt)};
}

export function pavageHexaGen(width : number, height : number, nbOfPatterns: number, color1: Color, color2: Color, color3: Color): Image {
    function pavageInt(x: number, y: number): Color {
        let scale = width/(2*nbOfPatterns); 
        let sinPis3 = Math.sin(Math.PI / 3);
        x = x % (3 * scale); //Again we use the symmetries
        y = y % (6 * sinPis3 * scale);
        if (x > 3 * scale / 2)
            x = 3 * scale - x;
        if (y < sinPis3 * scale * 2) {
            if (y < sinPis3 * scale) {
                if (x < 0.5 * (y / sinPis3 + 1 * scale))
                    return color1;
                else
                    return color2;
            }
            else {
                if (x < -0.5 * (y / sinPis3 - 3 * scale))
                    return color1;
                else
                    return color3;
            }
        }
        if (y < sinPis3 * scale * 4) {
            y = y - 2 * sinPis3 * scale;
            if (y < sinPis3 * scale) {
                if (x < 0.5 * (y / sinPis3 + 1 * scale))
                    return color2;
                else
                    return color3;
            }
            else {
                if (x < -0.5 * (y / sinPis3 - 3 * scale))
                    return color2;
                else
                    return color1;
            }
        }
        else {
            y = y - 4 * sinPis3 * scale;
            if (y < sinPis3 * scale) {
                if (x < 0.5 * (y / sinPis3 + 1 * scale))
                    return color3;
                else
                    return color1;
            }
            else {
                if (x < -0.5 * (y / sinPis3 - 3 * scale))
                    return color3;
                else
                    return color2;
            }
        }
    }
    return {width, height, function : contour(pavageInt)};
}

//pavages semi-réguliers
export function pavageCarréAdouciGen(width : number, height : number, nbOfPatterns : number, color1 : Color, color2 : Color, color3 : Color) : Image {
    function pavageInt(x : number, y : number) : Color {
        let size = width/nbOfPatterns;
        let sinPis3 = Math.sin(Math.PI/3);
        let cosPis3 = Math.cos(Math.PI/3);
        let cosPis6 = Math.cos(Math.PI/6);
        x = x%((2*sinPis3 + 1)*size);
        y = y%((2*sinPis3 + 1)*size);
        if (x < (sinPis3 + 0.5)*size){
            if (y < (sinPis3 + 0.5)*size){
                if (y > 2*sinPis3*x + 0.5*size)
                    return color1;
                if (y < -1/(2*sinPis3)*x + 0.5*size)
                    return color1;
                if (y > -1/(2*sinPis3)*x + (0.5 + 1/cosPis6)*size)
                    return color2;
                if (y < 2*sinPis3*x - (1/cosPis3 - 0.5)*size)
                    return color2;
                return color3;
            }
            else {
                y = (2*sinPis3 + 1)*size - y;
                if (y > 2*sinPis3*x + 0.5*size)
                    return color2;
                if (y < -1/(2*sinPis3)*x + 0.5*size)
                    return color1;
                if (y > -1/(2*sinPis3)*x + (0.5 + 1/cosPis6)*size)
                    return color2;
                if (y < 2*sinPis3*x - (1/cosPis3 - 0.5)*size)
                    return color1;
                return color3;
            }            
        }
        else {
            x = (2*sinPis3 + 1)*size - x;
            if (y < (sinPis3 + 0.5)*size){
                if (y > 2*sinPis3*x + 0.5*size)
                    return color1;
                if (y < -1/(2*sinPis3)*x + 0.5*size)
                    return color2;
                if (y > -1/(2*sinPis3)*x + (0.5 + 1/cosPis6)*size)
                    return color1;
                if (y < 2*sinPis3*x - (1/cosPis3 - 0.5)*size)
                    return color2;
                return color3;
            }
            else {
                y = (2*sinPis3 + 1)*size - y;
                if (y > 2*sinPis3*x + 0.5*size)
                    return color2;
                if (y < -1/(2*sinPis3)*x + 0.5*size)
                    return color2;
                if (y > -1/(2*sinPis3)*x + (0.5 + 1/cosPis6)*size)
                    return color1;
                if (y < 2*sinPis3*x - (1/cosPis3 - 0.5)*size)
                    return color1;
                return color3;
            }            
        }
    }
    return {width, height, function : contour(pavageInt)};
}
/*
export function pavageGrandRhombitrihexagonalGen(width : number, height : number, nbOfPatterns : number, color1 : Color, color2 : Color, color3 : Color) : Image {
    function pavageInt(x : number, y : number) : Color {
        let size = width/nbOfPatterns; //size is the scale
        let sinPis12 = Math.sin(Math.PI/12);
        let sinPis3 = Math.sin(Math.PI/3);
        let c = 2*sinPis12*size; //c is the length of a side of the dodecagone, if we take a radius of 1.
        y = y%((1 + sinPis12)*size); //Reducing x and y on a rectangle which is 1 repetition of the motif
        x = x%((1 + sinPis12 + sinPis12*sinPis3)*size);
        if (x > (1 + sinPis12 + sinPis12*sinPis3)/2*size) //Using the symetries
            x = (1 + sinPis12 + sinPis12*sinPis3)*size - x;
        if (y > (1 + sinPis12)/2*size)
            y = (1 + sinPis12)*size - y;
        
    }
}
*/