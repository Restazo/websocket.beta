class BusinessConnection {
  constructor(waiter_id, ws, business_id, connection_type) {
    this.waiter_id = waiter_id;
    this.ws = ws;
    this.connection_type = connection_type;
    this.business_id = business_id;
  }
}

export default BusinessConnection;
