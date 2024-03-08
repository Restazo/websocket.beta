import { v4 } from "uuid";

class WaiterCall {
  constructor(tableNumber) {
    this.tableNumber = tableNumber;
    this.ts = new Date().getTime();
    this.waiterCallID = v4();
  }
}

export default WaiterCall;
