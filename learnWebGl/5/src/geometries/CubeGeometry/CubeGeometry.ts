import Geometry from "../Geometry";
import vertices from "./data/vertices";
import colors from "./data/colors";

export default class CubeGeometry extends Geometry {
    public get vertices(): Float32Array {
        return new Float32Array(vertices);
    }
    
    public get colors(): Uint8Array {
        return new Uint8Array(colors);
    }

   
}