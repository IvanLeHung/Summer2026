import { CheckinRecord } from "../types/checkin";
import { ensureCheckinColumns } from "./checkin";

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "");
const SUPABASE_TABLE = String(import.meta.env.VITE_SUPABASE_TABLE || "checkin_state");
const STATE_KEY = "records";

type RemotePayload = {
  records: CheckinRecord[];
  updatedAt?: string;
};

export const isRemoteSyncEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const getEndpoint = () => `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`;

const getHeaders = (prefer?: string) => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  ...(prefer ? { Prefer: prefer } : {}),
});

export const loadRemoteRecords = async (): Promise<RemotePayload> => {
  if (!isRemoteSyncEnabled) return { records: [] };

  const response = await fetch(`${getEndpoint()}?key=eq.${STATE_KEY}&select=records,updated_at`, {
    headers: getHeaders(),
  });

  if (!response.ok) throw new Error("Cannot load remote check-in data");

  const rows = (await response.json()) as Array<{ records?: CheckinRecord[]; updated_at?: string }>;
  const row = rows[0];
  return {
    records: ensureCheckinColumns(Array.isArray(row?.records) ? row.records : []),
    updatedAt: row?.updated_at,
  };
};

export const saveRemoteRecords = async (records: CheckinRecord[]) => {
  if (!isRemoteSyncEnabled) return;

  const response = await fetch(`${getEndpoint()}?on_conflict=key`, {
    method: "POST",
    headers: getHeaders("resolution=merge-duplicates,return=minimal"),
    body: JSON.stringify({
      key: STATE_KEY,
      records,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) throw new Error("Cannot save remote check-in data");
};
