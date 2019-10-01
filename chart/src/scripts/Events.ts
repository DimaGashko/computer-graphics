export default class Events {
    private _handlers: {[type: string]: any[]} = {};

   addListener(type: string, handler: any) {
      this._handlers[type] = this._handlers[type] || [];
      this._handlers[type].push(handler);

      return handler;
   }

   removeListener(type: string, handler: any) {
      if (!this._handlers[type]) return;

      this._handlers[type] = this._handlers[type]
         .filter(item => item != handler);
   }

   emit(type: string, ...args: any) {
      if (!(type in this._handlers)) return;

      this._handlers[type].forEach((handler) => {
         handler(...args);
      });
   }
}