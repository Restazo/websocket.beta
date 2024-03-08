import { businessConnections, allConnections, waiterCalls } from "../index.js";
import VisitorConnection from "../models/visitorConnection.js";
import WSError from "../models/wsError.js";
import {
  verifyConnectionId,
  deleteConnection,
} from "../helpers/connectionHelpers.js";
import WaiterCall from "../models/waiterCall.js";

class visitorRoutes {
  initialize(tableNumber, table_id, business_id, connection_id) {
    try {
      allConnections.set(
        connection_id,
        new VisitorConnection(table_id, tableNumber, business_id)
      );
    } catch (e) {
      // Logging the error
      console.error(e);
      // Deleting the connection from the Map
      deleteConnection(connection_id);
      return new WSError(
        "Something went wrong with establishing your connection",
        "error"
      );
    }
  }

  callWaiter(ws, connection_id) {
    const metadata = verifyConnectionId(connection_id);
    if (!metadata) return ws.send("Initialise the connection first");
    const setOfConnectionsFromBusiness = businessConnections.get(
      metadata.business_id
    );

    if (!setOfConnectionsFromBusiness) {
      console.log("nobody connected");
      // Send a mobile notification to all the waiters
    } else {
      setOfConnectionsFromBusiness.forEach((wsConnection) => {
        // Assuming wsConnection is the actual WebSocket connection
        // You may need to adjust this based on how you're storing WebSocket connections in your businessConnections Map
        wsConnection.ws.send(
          JSON.stringify({
            status: "success",
            message: `Table ${metadata.tableNumber} asks for a waiter`,
          })
        );
      });
    }

    if (!waiterCalls.has(metadata.business_id)) {
      waiterCalls.set(metadata.business_id, new Map());
    }

    const tablesMap = waiterCalls.get(metadata.business_id);

    if (tablesMap.has(metadata.table_id))
      return ws.send("Waiter has been already called");

    tablesMap.set(metadata.table_id, new WaiterCall(metadata.tableNumber));

    console.log(waiterCalls);
    // add pending calling a waiter to a temporary storage
  }
  askBill() {}
}

export default visitorRoutes;
