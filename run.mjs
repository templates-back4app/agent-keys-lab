import { anon, owner, waitUp } from './client.mjs';
import { tools } from './agent.mjs';

await waitUp();
const line = (q, a) => console.log(`      ${q.padEnd(44)}${a}`);

// ── a backend with three people's data in it, and one secret ────────────────
const people = {};
for (const [u, p] of [['ana', 'correct-horse-1'], ['bruno', 'correct-horse-2'], ['carla', 'correct-horse-3']]) {
  const r = await anon.post('/users', { username: u, password: p, email: `${u}@example.com` });
  people[u] = { id: r.json.objectId, session: r.json.sessionToken };
}
for (const [who, { id }] of Object.entries(people)) {
  for (let i = 0; i < 4; i++) {
    await owner.post('/classes/Note', {
      text: `${who}'s note ${i + 1}`,
      owner: { __type: 'Pointer', className: '_User', objectId: id },
      ACL: { [id]: { read: true, write: true } },
    });
  }
}
await owner.post('/classes/Settings', { key: 'PROVIDER_KEY', value: 'sk-lab-0000-not-a-real-key', ACL: {} });
// the notes table itself requires a signed-in reader, like a careful app
await owner.put('/schemas/Note', { className: 'Note', classLevelPermissions: {
  find: { requiresAuthentication: true }, get: { requiresAuthentication: true },
  count: { requiresAuthentication: true }, create: { requiresAuthentication: true },
  update: { requiresAuthentication: true }, delete: { requiresAuthentication: true }, addField: {},
} });

const total = (await owner.get('/classes/Note?limit=0&count=1')).json.count;
console.log('');
console.log(`  Three people, ${total} notes between them, one stored provider key.`);
console.log('  The same agent, carrying a different credential each time.');
console.log('');

// Every destructive probe runs against a note that belongs to Bruno, so
// "it worked" never means "it deleted its own row".
const notMine = async () => {
  const r = await owner.get(`/classes/Note?limit=1&where=${encodeURIComponent(JSON.stringify({
    owner: { __type: 'Pointer', className: '_User', objectId: people.bruno.id } }))}`);
  return r.json.results[0];
};

for (const [label, cred] of [
  ['the master key', { master: true }],
  ["Ana's session", { session: people.ana.session }],
  ['the public app id only', {}],
]) {
  const t = tools(cred);
  console.log(`    carrying ${label}`);

  const notes = await t.read('Note');
  line('notes it can read:', notes.ok ? `${notes.json.results.length} of ${total}` : 'none — refused');

  const settings = await t.read('Settings');
  const key = settings.ok ? settings.json.results.find((r) => r.key === 'PROVIDER_KEY')?.value : null;
  line('the stored provider key:', key ? `readable — ${key}` : 'not readable');

  const schema = await t.schema();
  line('the full list of tables:', schema.ok ? `${schema.json.results.length} tables` : 'refused');

  const victim = await notMine();                 // one of Bruno's, always
  const del = await t.del('Note', victim.objectId);
  line("deleting one of Bruno's notes:", del.ok ? 'done' : 'refused');
  if (del.ok) await owner.post('/classes/Note', { text: victim.text, owner: victim.owner, ACL: victim.ACL });

  const perms = await t.setPermissions('Note');
  line('opening the table to everyone:', perms.ok ? 'done — and it stays done' : 'refused');
  if (perms.ok) await owner.put('/schemas/Note', { className: 'Note', classLevelPermissions: {
    find: { requiresAuthentication: true }, get: { requiresAuthentication: true },
    count: { requiresAuthentication: true }, create: { requiresAuthentication: true },
    update: { requiresAuthentication: true }, delete: { requiresAuthentication: true }, addField: {} } });
  console.log('');
}

// ── how long the worst case takes ───────────────────────────────────────────
console.log('    IF THE AGENT IS TOLD TO CLEAN UP');
console.log('');
const before = (await owner.get('/classes/Note?limit=0&count=1')).json.count;
const t = tools({ master: true });
const all = (await t.read('Note')).json.results;
const started = Date.now();
await Promise.all(all.map((n) => t.del('Note', n.objectId)));
const ms = Date.now() - started;
const after = (await owner.get('/classes/Note?limit=0&count=1')).json.count;
line('notes before:', String(before));
line('notes after:', String(after));
line('how long the agent needed:', `${ms} ms`);
line('rows the backup would restore:', 'whatever your backup holds — the agent did not take one');
console.log('');
