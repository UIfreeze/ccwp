// Input validation for API payloads. Throws HttpError(400) with a field map on failure.
import { HttpError } from './http.js';

export const PROJECT_STATUSES = [
  'brief', 'concept', 'script', 'storyboard', 'production', 'review', 'approved', 'delivered', 'archived',
];
export const PLATFORMS = ['linkedin', 'instagram', 'youtube_shorts', 'youtube', 'tiktok', 'website', 'other'];
export const ASPECT_RATIOS = ['4:5', '9:16', '16:9', '1:1'];
export const PROJECT_ROLES = ['owner', 'editor', 'reviewer', 'viewer'];

const TEXT_FIELDS = {
  name: 120, description: 2000, objective: 2000, audience: 2000, core_message: 500, cta: 300,
  constraints: 4000, references_notes: 4000, approver: 120,
};

export function validateProject(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Expected a JSON object.');
  const out = {};
  const errors = {};

  for (const [field, max] of Object.entries(TEXT_FIELDS)) {
    if (!(field in input)) continue;
    const v = input[field];
    if (typeof v !== 'string') { errors[field] = 'Must be text.'; continue; }
    const t = v.trim();
    if (t.length > max) errors[field] = `Must be ${max} characters or fewer.`;
    else out[field] = t;
  }
  if (!partial && !out.name) errors.name = 'A project name is required.';
  if (partial && 'name' in out && !out.name) errors.name = 'A project name cannot be empty.';

  if ('status' in input) {
    if (!PROJECT_STATUSES.includes(input.status)) errors.status = 'Unknown status.';
    else out.status = input.status;
  }
  for (const [field, allowed] of [['platforms', PLATFORMS], ['aspect_ratios', ASPECT_RATIOS]]) {
    if (!(field in input)) continue;
    const v = input[field];
    if (!Array.isArray(v) || v.some((x) => !allowed.includes(x))) errors[field] = 'Contains an unsupported value.';
    else out[field] = [...new Set(v)];
  }
  if ('duration_seconds' in input) {
    const v = input.duration_seconds;
    if (v === null || v === '') out.duration_seconds = null;
    else if (!Number.isInteger(v) || v < 1 || v > 7200) errors.duration_seconds = 'Must be a whole number of seconds (1–7200).';
    else out.duration_seconds = v;
  }
  if ('due_date' in input) {
    const v = input.due_date;
    if (v === null || v === '') out.due_date = null;
    else if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) errors.due_date = 'Use YYYY-MM-DD.';
    else out.due_date = v;
  }

  if (Object.keys(errors).length) throw new HttpError(400, 'Please fix the highlighted fields.', { fields: errors });
  return out;
}

export function validateMemberInput(input) {
  const errors = {};
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  const role = input?.role;
  if (!PROJECT_ROLES.includes(role) || role === 'owner') errors.role = 'Role must be editor, reviewer or viewer.';
  if (Object.keys(errors).length) throw new HttpError(400, 'Please fix the highlighted fields.', { fields: errors });
  return { email, role };
}
