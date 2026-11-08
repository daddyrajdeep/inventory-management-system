import { users } from '../data/users';
import { delay } from '../utils/delay';

// Backend phase: await api.get('/users')
export async function getUsers() {
  await delay();
  return users;
}
