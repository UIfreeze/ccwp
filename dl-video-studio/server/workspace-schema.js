// Field definitions for every production-workspace section. The server validates against these
// and the browser builds its forms from them (served at /api/workspace-schema), so they never drift.

const SHOT_SIZES = ['extreme_wide', 'wide', 'medium', 'medium_close_up', 'close_up', 'extreme_close_up', 'insert', 'graphic_full_frame'];
const METHODS = ['motion_graphics', 'ui_animation', 'ai_video', 'ai_image', 'stock_licensed', 'live_action', 'screen_recording', '3d'];
const ASPECTS = ['4:5', '9:16', '16:9', '1:1'];

export const WORKSPACE = {
  concept: {
    label: 'Concepts', singular: 'Concept', titleField: 'title',
    intro: 'Develop two or three distinct directions, then mark one as selected.',
    fields: [
      { key: 'title', label: 'Working title', type: 'text', max: 120, required: true },
      { key: 'status', label: 'Status', type: 'enum', options: ['draft', 'shortlisted', 'selected', 'rejected'], default: 'draft' },
      { key: 'insight', label: 'Audience insight', type: 'longtext', max: 2000, hint: 'The real tension or belief this concept speaks to.' },
      { key: 'hook', label: 'Hook (first 2–3 seconds)', type: 'longtext', max: 1000 },
      { key: 'story', label: 'Story arc', type: 'longtext', max: 4000 },
      { key: 'visual_metaphor', label: 'Visual idea / metaphor', type: 'longtext', max: 2000 },
      { key: 'rationale', label: 'Business rationale', type: 'longtext', max: 2000 },
    ],
  },
  scene: {
    label: 'Script & storyboard', singular: 'Scene', titleField: 'title',
    intro: 'One card per scene: what is heard, what is read on screen, and what is seen.',
    fields: [
      { key: 'title', label: 'Scene title', type: 'text', max: 120, required: true },
      { key: 'purpose', label: 'Story function', type: 'text', max: 300, hint: 'e.g. hook, problem, proof, offer, CTA' },
      { key: 'duration_seconds', label: 'Duration (s)', type: 'int', min: 1, max: 600 },
      { key: 'voiceover', label: 'Voiceover / dialogue', type: 'longtext', max: 4000 },
      { key: 'on_screen_text', label: 'On-screen text', type: 'longtext', max: 1000 },
      { key: 'visual', label: 'Storyboard — what we see', type: 'longtext', max: 4000, hint: 'Composition, subject, action, key graphics.' },
      { key: 'camera', label: 'Camera / motion', type: 'text', max: 300 },
      { key: 'transition', label: 'Transition out', type: 'text', max: 200 },
      { key: 'sound', label: 'Music / SFX', type: 'longtext', max: 1000 },
      { key: 'notes', label: 'Notes', type: 'longtext', max: 2000 },
    ],
  },
  shot: {
    label: 'Shot list', singular: 'Shot', titleField: 'title',
    intro: 'Every shot has one purpose and a production method.',
    fields: [
      { key: 'title', label: 'Shot', type: 'text', max: 120, required: true },
      { key: 'scene_id', label: 'Scene', type: 'ref', ref: 'scene' },
      { key: 'method', label: 'Method', type: 'enum', options: METHODS, default: 'motion_graphics' },
      { key: 'status', label: 'Status', type: 'enum', options: ['planned', 'in_progress', 'ready', 'approved'], default: 'planned' },
      { key: 'shot_size', label: 'Shot size', type: 'enum', options: SHOT_SIZES },
      { key: 'duration_seconds', label: 'Duration (s)', type: 'int', min: 1, max: 600 },
      { key: 'angle', label: 'Angle', type: 'text', max: 200 },
      { key: 'movement', label: 'Camera movement', type: 'text', max: 200 },
      { key: 'lens', label: 'Lens / look', type: 'text', max: 200 },
      { key: 'purpose', label: 'Purpose', type: 'longtext', max: 1000 },
    ],
  },
  prompt: {
    label: 'Prompts', singular: 'Prompt', titleField: 'title',
    intro: 'Structured prompts you can reproduce and revise. Writing a prompt here never spends credits.',
    fields: [
      { key: 'title', label: 'Prompt name', type: 'text', max: 120, required: true },
      { key: 'shot_id', label: 'Shot', type: 'ref', ref: 'shot' },
      { key: 'tool', label: 'Tool / model', type: 'text', max: 120, hint: 'Verify the current model name in the tool before use.' },
      { key: 'subject', label: 'Subject / character', type: 'longtext', max: 1500 },
      { key: 'action', label: 'Action (one primary action)', type: 'longtext', max: 1000 },
      { key: 'setting', label: 'Setting', type: 'longtext', max: 1500 },
      { key: 'camera', label: 'Camera', type: 'longtext', max: 1000 },
      { key: 'light', label: 'Light', type: 'longtext', max: 1000 },
      { key: 'style', label: 'Style', type: 'longtext', max: 1000 },
      { key: 'composition', label: 'Composition & safe areas', type: 'longtext', max: 1000 },
      { key: 'audio', label: 'Audio', type: 'longtext', max: 1000 },
      { key: 'continuity', label: 'Continuity', type: 'longtext', max: 1500 },
      { key: 'avoid', label: 'Avoid', type: 'longtext', max: 1500 },
      { key: 'aspect_ratio', label: 'Aspect ratio', type: 'enum', options: ASPECTS },
      { key: 'duration_seconds', label: 'Duration (s)', type: 'int', min: 1, max: 120 },
      { key: 'outputs', label: 'Outputs requested', type: 'int', min: 1, max: 8, default: 1 },
      { key: 'notes', label: 'Notes / results', type: 'longtext', max: 2000 },
    ],
  },
  asset: {
    label: 'Assets', singular: 'Asset', titleField: 'name',
    intro: 'Register every asset with where it came from and its licence. Files themselves arrive with the media pipeline (Milestone 6).',
    fields: [
      { key: 'name', label: 'Asset name', type: 'text', max: 160, required: true },
      { key: 'type', label: 'Type', type: 'enum', options: ['footage', 'image', 'ui', 'logo', 'font', 'music', 'sfx', 'voice', '3d', 'other'], default: 'image' },
      { key: 'origin', label: 'Origin', type: 'enum', options: ['created_in_house', 'user_supplied', 'client_supplied', 'licensed_stock', 'ai_generated'], default: 'created_in_house' },
      { key: 'licence_status', label: 'Licence status', type: 'enum', options: ['unknown', 'pending', 'cleared', 'restricted'], default: 'unknown' },
      { key: 'licence', label: 'Licence / permission details', type: 'longtext', max: 1500 },
      { key: 'location', label: 'Source / location', type: 'text', max: 500, hint: 'File path, library name or URL. Don’t paste private links into shared projects.' },
      { key: 'shot_id', label: 'Used in shot', type: 'ref', ref: 'shot' },
      { key: 'notes', label: 'Notes', type: 'longtext', max: 1500 },
    ],
  },
  checklist: {
    label: 'Checklist', singular: 'Checklist item', titleField: 'label',
    intro: 'Production and QA gates. Factual accuracy, rights and brand safety must be fully cleared before publishing.',
    fields: [
      { key: 'label', label: 'Item', type: 'text', max: 300, required: true },
      { key: 'category', label: 'Category', type: 'enum', options: ['brief', 'creative', 'production', 'sound', 'qa', 'delivery'], default: 'production' },
      { key: 'done', label: 'Done', type: 'bool', default: false },
    ],
  },
};

export const KINDS = Object.keys(WORKSPACE);

// Standard checklist drawn from the handbook's QA and delivery sections.
export const DEFAULT_CHECKLIST = [
  ['brief', 'Objective, audience, single core message and CTA agreed'],
  ['brief', 'Platforms, aspect ratios and target duration confirmed'],
  ['creative', 'Concept selected and approved'],
  ['creative', 'Script timed at realistic spoken pace'],
  ['creative', 'Every factual claim verified against an approved source'],
  ['production', 'Storyboard and shot list approved before paid generation'],
  ['production', 'Every paid generation individually approved with cost shown'],
  ['production', 'Official DL logo, fonts and colours used (never regenerated)'],
  ['production', 'Every asset has origin and licence recorded and cleared'],
  ['sound', 'Voiceover intelligible; music and SFX balanced'],
  ['sound', 'Music, SFX and voice licences / consent recorded'],
  ['qa', 'Typography: spelling, safe areas, no clipping'],
  ['qa', 'Motion: no stutter, jitter or awkward easing'],
  ['qa', 'Captions present and accurate'],
  ['qa', 'CEO / founder-prospect review: no category below 7; facts, rights, brand 10/10'],
  ['delivery', 'Exports checked: resolution, fps, codec, audio, file size per platform'],
  ['delivery', 'Editable project, assets, licences and ledgers archived'],
  ['delivery', 'Explicit final approval recorded before publishing'],
];
