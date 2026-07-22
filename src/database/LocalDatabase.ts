import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let dbInstance: SQLiteDatabase | null = null;
let currentXid: string | null = null;

const getDbName = (xid: string) => `messenger_local_${xid}.db`;

// ---------- Init ----------
export async function initLocalDB(xid: string): Promise<SQLiteDatabase> {
  // Same user, connection already open — reuse it as-is

  
  if (dbInstance && currentXid === xid) {
    return dbInstance;
  }

  // A different user's DB is open (or nothing consistent is tracked) — close first
  if (dbInstance && currentXid !== xid) {
    await dbInstance.close();
    dbInstance = null;
    currentXid = null;
  }

  dbInstance = await SQLite.openDatabase({
    name: getDbName(xid),
    location: 'default',
  });
  currentXid = xid;

  await dbInstance.executeSql(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY,
      sender_xid TEXT NOT NULL,
      receiver_xid TEXT NOT NULL,
      message_text TEXT,
      message_type TEXT NOT NULL,
      media_data TEXT,
      created_at TEXT NOT NULL
    );

    
  `);


  await dbInstance.executeSql(`
  CREATE TABLE IF NOT EXISTS contacts (
    xid TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );
`);
  // Helpful index — most queries filter by the two participants
  await dbInstance.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_messages_pair
    ON messages (sender_xid, receiver_xid);
  `);

  console.log(`[LocalDB] Initialized for xid=${xid}`);
  return dbInstance;
}

// ---------- Close (called on logout) ----------
export async function closeLocalDB(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    console.log(`[LocalDB] Closed connection for xid=${currentXid}`);
  }
  dbInstance = null;
  currentXid = null;
}

function getDB(): SQLiteDatabase {
  if (!dbInstance) {
    throw new Error('LocalDB not initialized — call initLocalDB(xid) first');
  }
  return dbInstance;
}

// ---------- Insert (used for both sent + received messages) ----------
export async function saveMessageLocally(msg: {
  id: number;
  sender_xid: string;
  receiver_xid: string;
  message_text: string;
  message_type: string;
  media_data?: string | null;
  created_at: string;
}) {
  const db = getDB();
  await db.executeSql(
    `INSERT OR REPLACE INTO messages
     (id, sender_xid, receiver_xid, message_text, message_type, media_data, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      msg.id,
      msg.sender_xid,
      msg.receiver_xid,
      msg.message_text,
      msg.message_type,
      msg.media_data ?? null,
      msg.created_at,
    ]
  );
}

// Bulk insert — used when syncing full history from server first time
export async function saveMessagesLocally(msgs: any[]) {
  const db = getDB();

  if (!msgs || msgs.length === 0) return;

  await db.transaction((tx) => {
    // NOTE: no async/await here — all executeSql calls must be queued
    // synchronously inside this callback, or the transaction commits early.
    msgs.forEach((msg) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO messages
         (id, sender_xid, receiver_xid, message_text, message_type, media_data, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          msg.id,
          msg.sender_xid,
          msg.receiver_xid,
          msg.message_text,
          msg.message_type,
          msg.media_data ?? null,
          msg.created_at,
        ]
      );
    });
  });
}

// ---------- Fetch conversation between two users ----------
export async function getLocalMessages(myXid: string, otherXid: string) {
  const db = getDB();
  const [result] = await db.executeSql(
    `SELECT * FROM messages
     WHERE (sender_xid = ? AND receiver_xid = ?)
        OR (sender_xid = ? AND receiver_xid = ?)
     ORDER BY created_at ASC`,
    [myXid, otherXid, otherXid, myXid]
  );

  const rows: any[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(result.rows.item(i));
  }
  return rows;
}

// ---------- Mark a message as deleted-for-everyone locally (keeps the row, replaces its content) ----------
// ---------- Mark a message as deleted-for-everyone locally ----------
// Uses INSERT OR REPLACE so this works even if the row never existed locally
// (receiver was offline when the original message + its delete both happened)
export async function markMessageDeletedLocally(msg: {
  id: number;
  sender_xid: string;
  receiver_xid: string;
  created_at: string;
}) {
  const db = getDB();
  await db.executeSql(
    `INSERT OR REPLACE INTO messages
     (id, sender_xid, receiver_xid, message_text, message_type, media_data, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      msg.id,
      msg.sender_xid,
      msg.receiver_xid,
      'This message was deleted',
      'deleted',
      null,
      msg.created_at,
    ]
  );
}

// ---------- Check if a message already exists locally (avoid duplicate downloads) ----------
export async function messageExistsLocally(id: number): Promise<boolean> {
  const db = getDB();
  const [result] = await db.executeSql(
    `SELECT id FROM messages WHERE id = ? LIMIT 1`,
    [id]
  );
  return result.rows.length > 0;
}


// ---------- Contacts (xid -> name cache, needed since messages only store xid) ----------
export async function saveContactLocally(xid: string, name: string) {
  if (!xid || !name) return;
  const db = getDB();
  await db.executeSql(
    `INSERT OR REPLACE INTO contacts (xid, name) VALUES (?, ?)`,
    [xid, name]
  );
}

// ---------- Build the conversations list entirely from local history ----------
// This is now the source of truth for the sidebar, since MySQL only holds
// messages temporarily until they're delivered.
export async function getLocalConversations(myXid: string) {
  const db = getDB();

  const [result] = await db.executeSql(
    `SELECT * FROM messages WHERE sender_xid = ? OR receiver_xid = ? ORDER BY created_at ASC`,
    [myXid, myXid]
  );

  const rows: any[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(result.rows.item(i));
  }

  // Since rows are ASC by created_at, the last write per "other party" wins —
  // giving us the most recent message per conversation.
  const latestByOther: Record<string, any> = {};
  rows.forEach((row) => {
    const otherXid = row.sender_xid === myXid ? row.receiver_xid : row.sender_xid;
    latestByOther[otherXid] = row;
  });

  const otherXids = Object.keys(latestByOther);
  if (otherXids.length === 0) return [];

  const placeholders = otherXids.map(() => '?').join(',');
  const [nameResult] = await db.executeSql(
    `SELECT xid, name FROM contacts WHERE xid IN (${placeholders})`,
    otherXids
  );
  const nameMap: Record<string, string> = {};
  for (let i = 0; i < nameResult.rows.length; i++) {
    const r = nameResult.rows.item(i);
    nameMap[r.xid] = r.name;
  }

  const previewFor = (msg: any) => {
    if (msg.message_type === 'deleted') return 'This message was deleted';
    if (msg.message_type === 'image') return 'Photo';
    if (msg.message_type === 'video') return 'Video';
    if (msg.message_type === 'document') return msg.message_text || 'Document';
    return msg.message_text;
  };

  const list = otherXids.map((xid) => {
    const msg = latestByOther[xid];
    return {
      other_xid: xid,
      other_name: nameMap[xid] || xid, // fallback if name not cached yet
      last_message: previewFor(msg),
      last_time: msg.created_at,
    };
  });

  list.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
  return list;
}

// ---------- Delete a single message locally ----------
export async function deleteMessageLocally(id: number) {
  const db = getDB();
  await db.executeSql(`DELETE FROM messages WHERE id = ?`, [id]);
}