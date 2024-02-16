// namespaceManager.js
class NamespaceManager {
  constructor(io) {
    this.io = io;
    this.userNamespaces = new Map();
    this.driverNamespaces = new Map();
  }

  createUserNamespace(userID) {
    const userNamespace = `/userNamespace/${userID}`;
    const namespace = this.io.of(userNamespace);
    this.userNamespaces.set(userID, namespace);
    return namespace;
  }

  createDriverNamespace(driverID) {
    const driverNamespace = `/driverNamespace/${driverID}`;
    const namespace = this.io.of(driverNamespace);
    this.driverNamespaces.set(driverID, namespace);
    return namespace;
  }

  getUserNamespace(userID) {
    return this.userNamespaces.get(userID);
  }

  getDriverNamespace(driverID) {
    return this.driverNamespaces.get(driverID);
  }

  disconnectUserNamespace(userID) {
    const userNamespace = this.getUserNamespace(userID);
    if (userNamespace) {
      userNamespace.sockets.forEach((socket) => {
        socket.disconnect(true);
      });
      this.userNamespaces.delete(userID);
    }
  }

  disconnectDriverNamespace(driverID) {
    const driverNamespace = this.getDriverNamespace(driverID);
    if (driverNamespace) {
      driverNamespace.sockets.forEach((socket) => {
        socket.disconnect(true);
      });
      this.driverNamespaces.delete(driverID);
    }
  }

  destroyUserNamespace(userID) {
    const userNamespace = this.getUserNamespace(userID);
    if (userNamespace) {
      this.disconnectUserNamespace(userID);
      userNamespace.removeAllListeners();
    }
  }

  destroyDriverNamespace(driverID) {
    const driverNamespace = this.getDriverNamespace(driverID);
    if (driverNamespace) {
      this.disconnectDriverNamespace(driverID);
      driverNamespace.removeAllListeners();
    }
  }
}

export default NamespaceManager;
