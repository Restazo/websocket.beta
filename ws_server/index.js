import { WebSocket, WebSocketServer } from "ws";
import { v4 } from "uuid";
import visitorRoutes from "./routes/visitorRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";

const wss = new WebSocketServer({ port: 3000 });

const visitorRoutesInstance = new visitorRoutes();
const businessRoutesInstance = new businessRoutes();
// Use a Map to store connections with a unique identifiers
const businessConnections = new Map();
const visitorConnections = new Map();
const connectionMetadata = new Map();
const waiterCalls = new Map();

wss.on("connection", function connection(ws) {
  console.log(`New client connected`);
  const connection_id = v4();

  ws.on("message", function incoming(message) {
    try {
      const msg = JSON.parse(message);

      // Protection rule if route property is not provided in message contents
      if (!msg.route) {
        return ws.send(
          JSON.stringify({ status: "error", message: "Route is not specified" })
        );
      }
      // if (
      //   !msg.connection_id &&
      //   (!msg.route || !msg.payload.connection_type || !msg.payload.business_id)
      // )
      //   return ws.send("Some of required properties are not provided");

      switch (msg.route) {
        case "/init":
          if (
            !msg.payload ||
            !msg.payload.connection_type ||
            !msg.payload.business_id
          ) {
            return ws.send(
              JSON.stringify({
                status: "error",
                message:
                  "Initialization requires 'connection_type' and 'business_id'",
              })
            );
          }
          // Initialise the connection with the client:
          // Pretend like this comes from decryption either of QR code stored data from visitor
          // or from the authorization token from business
          const { connection_type, business_id } = msg.payload;

          connectionMetadata.set(connection_id, {
            business_id,
            connection_type,
            table_id: msg.payload.table_id,
          });

          switch (connection_type) {
            case "visitor":
              if (!msg.payload.table_id) {
                return ws.send(
                  JSON.stringify({
                    status: "error",
                    message: "Initialization requires 'table_id''",
                  })
                );
              }
              // This will come from the decryption
              const { table_id } = msg.payload;
              visitorRoutesInstance.initialize(
                table_id,
                business_id,
                connection_id
              );
              break;

            case "business":
              businessRoutesInstance.initialize(business_id, connection_id, ws);
              break;

            default:
              return ws.send(
                JSON.stringify({
                  status: "fail",
                  connection_id: "Invalid connection type",
                })
              );
          }

          return ws.send(
            JSON.stringify({
              status: "success",
              msg: "Connection initialized",
              connection_id: connection_id,
            })
          );
        case "/call":
          if (!msg.connection_id) {
            return ws.send(
              JSON.stringify({
                status: "error",
                message: "This route requires 'connection_id'",
              })
            );
          }
          visitorRoutesInstance.callWaiter(ws, connection_id);

          // Notify the exact business connection and store the call in temporary storage
          break;
        default:
          ws.send(
            JSON.stringify({
              status: "fail",
              connection_id: "Invalid route",
            })
          );
      }
      console.log(visitorConnections);
      console.log(businessConnections);
    } catch (error) {
      console.error("Error processing message:", error);
      return ws.send(
        JSON.stringify({ status: "error", message: "Invalid JSON format" })
      );
    }
  });

  ws.on("close", () => {
    console.log(`Client disconnected`);

    const metadata = visitorRoutesInstance.verifyConnectionId(connection_id);
    if (!metadata) return;

    const { business_id, table_id, connection_type } = metadata;
    connectionMetadata.delete(connection_id);

    if (connection_type === "visitor" && table_id) {
      const tableConnections = visitorConnections
        .get(business_id)
        ?.get(table_id);
      if (tableConnections) {
        tableConnections.delete(connection_id);
        if (tableConnections.size === 0) {
          visitorConnections.get(business_id)?.delete(table_id);
          if (visitorConnections.get(business_id).size === 0) {
            visitorConnections.delete(business_id);
          }
        }
      }
    } else if (connection_type === "business") {
      const connectionsFromBusiness = businessConnections.get(business_id);
      if (connectionsFromBusiness) {
        connectionsFromBusiness.delete(connection_id);
        if (connectionsFromBusiness.size === 0) {
          businessConnections.delete(business_id);
        }
      }
    }
  });
});

export { visitorConnections, businessConnections, connectionMetadata };
