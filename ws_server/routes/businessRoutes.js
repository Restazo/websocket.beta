import { businessConnections } from "../index.js";

class businessRoutes {
  initialize(business_id, connection_id, ws) {
    // Verify the request details, as each separate waiter can access this
    // they will provide access_token which must be verified with the refresh_token
    // from database etc
    if (!businessConnections.has(business_id)) {
      businessConnections.set(business_id, new Set());
    }

    const connectionsFromBusiness = businessConnections.get(business_id);

    connectionsFromBusiness.add({ connection_id, ws });
  }
}

export default businessRoutes;
