const Message = require("../models/Message");

const onlineUsers = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);

    socket.on("user:online", (userId) => {
      onlineUsers[userId] = socket.id;
      socket.userId = userId;
      io.emit("online:users", Object.keys(onlineUsers));
      console.log("👥 Online:", Object.keys(onlineUsers));
    });

    socket.on(
      "send:private",
      async ({ sender, receiver, content, messageType, imageUrl }) => {
        try {
          const msg = await Message.create({
            sender,
            receiver,
            content: content || "",
            messageType: messageType || "text",
            imageUrl: imageUrl || "",
          });
          const receiverSocket = onlineUsers[receiver];
          if (receiverSocket) io.to(receiverSocket).emit("receive:private", msg);
          socket.emit("receive:private", msg);
          console.log("💬 Msg:", sender, "->", receiver);
        } catch (err) {
          console.error("❌ Message error:", err.message);
        }
      },
    );

    socket.on("typing", ({ sender, receiver }) => {
      const receiverSocket = onlineUsers[receiver];
      if (receiverSocket) io.to(receiverSocket).emit("user:typing", { sender });
    });

    socket.on("delete:message", async ({ messageId, sender, receiver }) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          deleted: true,
          content: "",
          imageUrl: "",
        });
        socket.emit("message:deleted", { messageId });
        const receiverSocket = onlineUsers[receiver];
        if (receiverSocket)
          io.to(receiverSocket).emit("message:deleted", { messageId });
      } catch (err) {
        console.error("❌ Delete error:", err.message);
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        delete onlineUsers[socket.userId];
        io.emit("online:users", Object.keys(onlineUsers));
      }
      console.log("🔴 Disconnected:", socket.id);
    });
  });
};
