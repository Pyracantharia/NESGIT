import { useState } from "react";

export default function RoomList({
  rooms,
  activeRoomId,
  onRefresh,
  onCreate,
  onJoin,
  onInvite,
  loading,
}) {
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteCanSeeHistory, setInviteCanSeeHistory] = useState(true);

  async function handleCreate(event) {
    event.preventDefault();
    const name = newRoomName.trim();
    if (!name) return;
    await onCreate({ name, isPrivate: newRoomPrivate });
    setNewRoomName("");
    setNewRoomPrivate(false);
  }

  async function handleJoin(event) {
    event.preventDefault();
    const parsed = Number(joinRoomId);
    if (Number.isNaN(parsed)) return;
    await onJoin(parsed);
    setJoinRoomId("");
  }

  async function handleInvite(event) {
    event.preventDefault();
    const username = inviteUsername.trim();
    if (!username || !activeRoomId || !onInvite) return;
    await onInvite({
      roomId: Number(activeRoomId),
      username,
      canSeeHistory: inviteCanSeeHistory,
    });
    setInviteUsername("");
  }

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h6 mb-0">Rooms</h2>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <form className="mb-3" onSubmit={handleCreate}>
          <label className="form-label">Create room</label>
          <div className="input-group">
            <input
              className="form-control"
              placeholder="Room name"
              value={newRoomName}
              onChange={(event) => setNewRoomName(event.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Create
            </button>
          </div>
          <div className="form-check mt-2">
            <input
              id="roomPrivateFlag"
              type="checkbox"
              className="form-check-input"
              checked={newRoomPrivate}
              onChange={(event) => setNewRoomPrivate(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="roomPrivateFlag">
              Private room
            </label>
          </div>
        </form>

        <form className="mb-3" onSubmit={handleJoin}>
          <label className="form-label">Join by id</label>
          <div className="input-group">
            <input
              className="form-control"
              placeholder="Room id"
              value={joinRoomId}
              onChange={(event) => setJoinRoomId(event.target.value)}
            />
            <button className="btn btn-outline-primary" type="submit">
              Join
            </button>
          </div>
        </form>

        <form className="mb-3" onSubmit={handleInvite}>
          <label className="form-label">Invite user to active room</label>
          <div className="input-group mb-2">
            <input
              className="form-control"
              placeholder="Username"
              value={inviteUsername}
              onChange={(event) => setInviteUsername(event.target.value)}
              disabled={!activeRoomId}
            />
            <button className="btn btn-outline-success" type="submit" disabled={!activeRoomId}>
              Invite
            </button>
          </div>
          <div className="form-check">
            <input
              id="inviteHistoryAccess"
              type="checkbox"
              className="form-check-input"
              checked={inviteCanSeeHistory}
              onChange={(event) => setInviteCanSeeHistory(event.target.checked)}
              disabled={!activeRoomId}
            />
            <label className="form-check-label" htmlFor="inviteHistoryAccess">
              Can see previous messages
            </label>
          </div>
        </form>

        <div className="list-group room-list-scroll">
          {rooms.length === 0 ? (
            <div className="list-group-item text-muted">No rooms found.</div>
          ) : (
            rooms.map((room) => {
              const isActive = Number(room.id) === Number(activeRoomId);
              return (
                <button
                  type="button"
                  key={room.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() => onJoin(room.id)}
                >
                  <span className="text-truncate me-2">
                    {room.name || `Room ${room.id}`}
                    {room.isPrivate ? " (Private)" : ""}
                  </span>
                  <span>#{room.id}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
