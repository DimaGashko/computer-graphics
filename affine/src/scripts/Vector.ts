
export default class Vector {
   constructor(public x: number = 0, public y: number = 0) {

   }

   copy() { 
      return new Vector(this.x, this.y);
   }

   set([x, y]: number[]) { 
      this.x = x;
      this.y = y;
   }

   add(v: Vector) { 
      this.x += v.x;
      this.y += v.y;

      return this;
   }

   sub(v: Vector) { 
      this.x -= v.x;
      this.y -= v.y;

      return this;
   }

   mul(v: Vector) { 
      this.x *= v.x;
      this.y *= v.y;

      return this;
   }

   div(v: Vector) {
      this.x /= v.x;
      this.y /= v.y;

      return this;
   }

   mod(v: Vector) { 
      this.x %= v.x;
      this.y %= v.y;

      return this;
   }

}