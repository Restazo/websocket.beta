import {
  visitorConnections,
  businessConnections,
  connectionMetadata,
} from "../index.js";

class visitorRoutes {
  initialize(table_id, business_id, connection_id) {
    // This also comes from decryption
    // const { table_id, business_id } = msg.payload;

    if (!visitorConnections.has(business_id)) {
      visitorConnections.set(business_id, new Map());
    }

    const tableConnections = visitorConnections.get(business_id);

    if (!tableConnections.has(table_id)) {
      tableConnections.set(table_id, new Set());
    }

    tableConnections.get(table_id).add(connection_id);
  }
  callWaiter(ws, connection_id) {
    const metadata = this.verifyConnectionId(connection_id);
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
            message: "Your waiter call has been received",
          })
        );
      });
    }
  }
  askBill() {}

  verifyConnectionId(connection_id) {
    const metadata = connectionMetadata.get(connection_id);
    if (!metadata) return false;
    return metadata;
  }
}

export default visitorRoutes;
