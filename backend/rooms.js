// Shared in-memory store for all active game rooms.
// Exported as a single Map so every module that needs to read/mutate
// room state always references the same object.

const rooms = new Map();

export default rooms;
