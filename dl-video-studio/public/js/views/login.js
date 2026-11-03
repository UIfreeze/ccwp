import { h } from '../dom.js';
import { api } from '../api.js';

export function loginView({ onSignedIn }) {
  const error = h('div', { class: 'alert error', role: 'alert', hidden: true });
  const submit = h('button', { class: 'btn primary block', type: 'submit' }, 'Sign in');
  const form = h('form', { class: 'stack', novalidate: true },
    h('div', { class: 'field' }, h('label', { for: 'email' }, 'Email'),
      h('input', { id: 'email', name: 'email', type: 'email', autocomplete: 'username', required: true })),
    h('div', { class: 'field' }, h('label', { for: 'password' }, 'Password'),
      h('input', { id: 'password', name: 'password', type: 'password', autocomplete: 'current-password', required: true })),
    error, submit);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.hidden = true;
    submit.disabled = true;
    try {
      const s = await api('/api/login', { method: 'POST', body: { email: form.email.value, password: form.password.value } });
      onSignedIn(s);
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      submit.disabled = false;
    }
  });
  return h('div', { class: 'login-wrap' },
    h('div', { class: 'card login' },
      h('div', { class: 'brand' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }),
        h('span', {}, 'DL Video Studio', h('small', {}, 'Private workspace — sign in to continue'))),
      form,
      h('p', { class: 'small muted mt-4' },
        'No account? An admin creates accounts locally with ', h('span', { class: 'mono' }, 'npm run create-admin'), '.')));
}
