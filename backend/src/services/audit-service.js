import { v4 as uuidv4 } from 'uuid';
import { queryAsync } from '../utils/schedule.js';

const serializeJson = (value) => {
  if (value === undefined || value === null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

export async function logAudit(connection, { entity, entityId, action, actorId, before, after }) {
  await queryAsync(
    connection,
    `INSERT INTO financial_audit_log (id, entity, entity_id, action, actor_id, before_json, after_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      entity,
      entityId,
      action,
      actorId || null,
      serializeJson(before),
      serializeJson(after)
    ]
  );
}
