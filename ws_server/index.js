import { WebSocket, WebSocketServer } from "ws";
import { v4 } from "uuid";
import visitorRoutes from "./routes/visitorRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import WSError from "./models/wsError.js";
import {
  verifyConnectionId,
  deleteConnection,
} from "./helpers/connectionHelpers.js";

const wss = new WebSocketServer({ port: 3000 });

const visitorRoutesInstance = new visitorRoutes();
const businessRoutesInstance = new businessRoutes();
// Use a Map to store connections with a unique identifiers
const businessConnections = new Map();
// const visitorConnections = new Map();
const allConnections = new Map();
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

      switch (msg.route) {
        case "/init":
          // Verify the message contents
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

          if (connection_type === "visitor") {
            // Verify if visitor provides table_id
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
            // Verify the table id with database, for now pretend like it comes
            // form a database
            const tableNumberSetByBusiness = "13";

            const result = visitorRoutesInstance.initialize(
              tableNumberSetByBusiness,
              table_id,
              business_id,
              connection_id
            );

            if (result instanceof WSError) {
              return ws.send(
                JSON.stringify({
                  status: result.status,
                  msg: result.message,
                })
              );
            }

            // Return successful message back to visitor
            return ws.send(
              JSON.stringify({
                status: "success",
                msg: "Connection established",
                connection_id: connection_id,
              })
            );
          } else if (connection_type === "business") {
            if (!msg.payload.waiter_id) {
              return ws.send(
                JSON.stringify({
                  status: "error",
                  message: "Initialization requires 'waiter_id''",
                })
              );
            }

            // Add error handling here
            const result = businessRoutesInstance.initialize(
              business_id,
              connection_id,
              msg.payload.waiter_id,
              connection_type,
              ws
            );

            if (result instanceof WSError) {
              return ws.send(
                JSON.stringify({
                  status: result.status,
                  msg: result.message,
                })
              );
            }
            // Return successful message back to business
            return ws.send(
              JSON.stringify({
                status: "success",
                msg: "Connection established",
                connection_id: connection_id,
                waiterCalls: result,
              })
            );
          } else {
            return ws.send(
              JSON.stringify({
                status: "fail",
                connection_id: "Invalid connection type",
              })
            );
          }
        case "/call":
          // Only established connections can access this route
          if (!msg.connection_id) {
            return ws.send(
              JSON.stringify({
                status: "error",
                message: "This route requires 'connection_id'",
              })
            );
          }
          visitorRoutesInstance.callWaiter(ws, connection_id);
          break;
        default:
          ws.send(
            JSON.stringify({
              status: "fail",
              connection_id: "Invalid route",
            })
          );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      return ws.send(
        JSON.stringify({
          status: "error",
          message: "Something went wrong with your message",
        })
      );
    }
  });

  ws.on("close", () => {
    const metadata = deleteConnection(connection_id);
    const { business_id, connection_type } = metadata;

    if (connection_type === "business") {
      const connectionsFromBusiness = businessConnections.get(business_id);
      if (connectionsFromBusiness) {
        connectionsFromBusiness.delete(connection_id);
        if (connectionsFromBusiness.size === 0) {
          businessConnections.delete(business_id);
        }
      }
    }

    console.log("//////////////////CHECK AFTER DELETION///////////////////");
    console.log(allConnections);
    console.log(businessConnections);
  });
});

export { businessConnections, allConnections, waiterCalls };
