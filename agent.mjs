// An agent's tool, defined three times. The tool is identical in each case —
// "read rows from a table", "delete rows from a table" — and the only thing
// that changes is the credential it carries.
//
// This lab does not measure whether a model can be talked into calling the
// tool. Assume it can: that is what prompt injection is, and it has been
// demonstrated against shipping products. What is measured here is the part you
// control — how much the tool reaches once it is called.
import { call } from './client.mjs';

export const CREDENTIALS = {
  'the master key':      { master: true },
  "a user's session":    { session: null },       // filled in at run time
  'the public app id':   {},
};

export const tools = (cred) => ({
  read:  (cls, where) => call('GET', `/classes/${cls}?limit=1000${where ? `&where=${encodeURIComponent(JSON.stringify(where))}` : ''}`, cred),
  del:   (cls, id) => call('DELETE', `/classes/${cls}/${id}`, cred),
  schema: () => call('GET', '/schemas', cred),
  setPermissions: (cls) => call('PUT', `/schemas/${cls}`, {
    ...cred, body: { className: cls, classLevelPermissions: { find: { '*': true }, get: { '*': true }, create: { '*': true }, update: { '*': true }, delete: { '*': true }, addField: { '*': true } } },
  }),
});
