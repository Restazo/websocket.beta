import { deleteConnection } from "../helpers/connectionHelpers.js";
import { businessConnections, allConnections, waiterCalls } from "../index.js";
import BusinessConnection from "../models/businessConnection.js";
import WSError from "../models/wsError.js";

class businessRoutes {
  initialize(business_id, connection_id, waiter_id, connection_type, ws) {
    // Verify the request details, as each separate waiter can access this
    // they will provide access_token which must be verified with the refresh_token
    // from database etc
    try {
      if (!businessConnections.has(business_id)) {
        businessConnections.set(business_id, new Map());
      }

      const connectionsFromBusiness = businessConnections.get(business_id);

      const newConnectionFromBusiness = new BusinessConnection(
        waiter_id,
        ws,
        business_id,
        connection_type
      );

      connectionsFromBusiness.set(connection_id, newConnectionFromBusiness);
      // Populate all the connections Map
      allConnections.set(connection_id, newConnectionFromBusiness);

      const tablesThatRequestedWaiter = waiterCalls.get(business_id);
      return tablesThatRequestedWaiter
        ? [...tablesThatRequestedWaiter.values()]
        : [];
    } catch (e) {
      console.error(e);
      deleteConnection(connection_id);
      return new WSError(
        "Something wend wrong with establishing your connection",
        "error"
      );
    }
  }
}

export default businessRoutes;
