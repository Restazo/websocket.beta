import { allConnections } from "../index.js";

const verifyConnectionId = (connection_id) => {
  const metadata = allConnections.get(connection_id);
  if (!metadata) return;
  return metadata;
};

const deleteConnection = (connection_id) => {
  const metadata = verifyConnectionId(connection_id);
  if (!metadata) return;

  allConnections.delete(connection_id);
  return metadata;
};

export { verifyConnectionId, deleteConnection };
