// Adds SYNTHETIC sample workspace content (concepts, scenes, shots, prompt, assets, checklist) to the
// "[DEMO] Founder idea-to-plan explainer" project. Only touches that demo project, and only if its workspace is empty.
import { fileURLToPath } from 'node:url';
import { openDatabase } from '../server/db.js';
import { createItem, addDefaultChecklist, updateItem } from '../server/workspace.js';

export function seedWorkspaceDemo(db) {
  const project = db.prepare("SELECT id, owner_id FROM projects WHERE name = '[DEMO] Founder idea-to-plan explainer'").get();
  if (!project) return 'Demo project not found — run `npm run seed` on an empty database first.';
  const count = db.prepare('SELECT COUNT(*) AS n FROM workspace_items WHERE project_id = ?').get(project.id).n;
  if (count) return 'Demo project already has workspace content; nothing changed.';
  const u = db.prepare('SELECT id, system_role FROM users WHERE id = ?').get(project.owner_id);
  const user = { id: u.id, systemRole: u.system_role };
  const add = (kind, data) => createItem(db, user, project.id, kind, data);

  add('concept', {
    title: 'The question cloud', status: 'selected',
    insight: 'Founders feel ready to build, but every open question about users, scope and cost is a hidden delay.',
    hook: 'A single idea dot on screen — then questions start orbiting it.',
    story: 'Idea → swarm of unanswered questions → months and money lost → a structured discovery turns questions into a plan → CTA.',
    visual_metaphor: 'Questions as floating UI chips that snap into a tidy plan layout.',
    rationale: 'Makes the value of discovery tangible without making unverified price claims.',
  });
  add('concept', { title: 'Two founders, two timelines', status: 'shortlisted', insight: 'Comparison makes the cost of skipping discovery visible.', hook: 'Split screen: same idea, two very different calendars.' });
  add('concept', { title: 'Blueprint unfolding', status: 'draft', visual_metaphor: 'A folded paper plan opening into screens and diagrams.' });

  const s1 = add('scene', { title: 'Hook — the idea', purpose: 'hook', duration_seconds: 4, voiceover: 'Every product starts with an idea.', on_screen_text: 'Every product starts with an idea', visual: 'Centred idea dot on a soft gradient; generous negative space.', camera: 'Slow push-in', transition: 'Questions pop in around the dot', sound: 'Soft pluck on the dot appearing' });
  const s2 = add('scene', { title: 'Problem — the questions', purpose: 'problem', duration_seconds: 6, voiceover: 'And a lot of questions. Who is it for? What goes in version one? What will it really cost to build?', on_screen_text: 'Who is it for? / What’s in v1? / What will it cost?', visual: 'Three pill-shaped question cards stagger in and orbit the dot.', transition: 'Cards collapse into a calendar' });
  add('scene', { title: 'Plan — clarity', purpose: 'proof', duration_seconds: 8, voiceover: 'A short, structured discovery turns those questions into user flows, a technical plan and a clickable prototype you can test before you build.', visual: 'Cards rearrange into a tidy grid of plan deliverables.' });
  add('scene', { title: 'CTA', purpose: 'CTA', duration_seconds: 4, voiceover: 'Start with clarity.', on_screen_text: 'Book a discovery call', visual: 'Logo lockup placeholder + CTA button.', sound: 'Resolve chord' });

  const sh1 = add('shot', { title: 'Idea dot reveal', scene_id: s1.id, method: 'motion_graphics', shot_size: 'graphic_full_frame', duration_seconds: 4, movement: 'Scale 0.9→1.0, ease-out', purpose: 'Establish the single idea and the calm visual language.' });
  add('shot', { title: 'Question chips orbit', scene_id: s2.id, method: 'ui_animation', shot_size: 'graphic_full_frame', duration_seconds: 6, purpose: 'Show uncertainty multiplying.' });
  add('shot', { title: 'Founder at desk (optional b-roll)', scene_id: s2.id, method: 'ai_video', status: 'planned', shot_size: 'medium', duration_seconds: 3, angle: 'Eye level', lens: '50mm look, shallow depth of field', purpose: 'Human moment; only if it adds value over pure graphics.' });

  add('prompt', {
    title: 'Founder at desk — b-roll test', tool: '(choose and verify model before use)',
    subject: 'A founder in their early thirties, casual dark sweater, laptop and notebook on a light wooden desk',
    action: 'Pauses typing and looks thoughtfully at a sticky note covered in question marks',
    setting: 'Small, tidy home office in soft morning light, plants and a window in the background',
    camera: 'Medium shot, eye level, slow 5% push-in', light: 'Soft window key light from the left, warm, low contrast',
    style: 'Natural, editorial documentary look, muted pastel palette', composition: 'Subject on the left third; keep the top 20% clear for captions',
    audio: 'Silent (music and SFX added in the edit)', continuity: 'Same sweater and desk in every take',
    avoid: 'Visible brand logos, on-screen text, warped hands, flicker, sudden camera cuts', aspect_ratio: '4:5', duration_seconds: 5, outputs: 1,
  });

  add('asset', { name: 'DL logo (official)', type: 'logo', origin: 'client_supplied', licence_status: 'pending', notes: 'Waiting for the official file. Never regenerate the logo.' });
  add('asset', { name: 'Background music bed', type: 'music', origin: 'licensed_stock', licence_status: 'unknown', notes: 'Not chosen yet.' });
  add('asset', { name: 'Idea dot + question chip vectors', type: 'ui', origin: 'created_in_house', licence_status: 'cleared', shot_id: sh1.id });

  const items = addDefaultChecklist(db, user, project.id);
  for (const i of items.slice(0, 2)) updateItem(db, user, project.id, 'checklist', i.id, { done: true });
  return 'Added synthetic workspace content to the demo project.';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const db = openDatabase(process.env.DLVS_DB || fileURLToPath(new URL('../data/studio.sqlite', import.meta.url)));
  console.log(seedWorkspaceDemo(db));
}
