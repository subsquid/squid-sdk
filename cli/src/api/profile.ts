import { api } from './api';

export async function profile() {
  const { body } = await api<{ username: string }>( {
    method: 'get',
    path: `/client/me`,
  });

  return body;
}
