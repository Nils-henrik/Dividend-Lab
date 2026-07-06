export type MockUser = {
  username: string;
  name: string;
};

const MOCK_AUTH_KEY = "dividend-lab:user";
const MOCK_AUTH_CHANGE_EVENT = "dividend-lab:auth-change";

const isBrowser = () => typeof window !== "undefined";
let cachedStoredUser: string | null = null;
let cachedUser: MockUser | null = null;

export function getMockUser(): MockUser | null {
  if (!isBrowser()) return null;

  const storedUser = window.localStorage.getItem(MOCK_AUTH_KEY);

  if (storedUser === cachedStoredUser) {
    return cachedUser;
  }

  cachedStoredUser = storedUser;

  if (!storedUser) {
    cachedUser = null;
    return cachedUser;
  }

  try {
    cachedUser = JSON.parse(storedUser) as MockUser;
    return cachedUser;
  } catch {
    window.localStorage.removeItem(MOCK_AUTH_KEY);
    cachedStoredUser = null;
    cachedUser = null;
    return cachedUser;
  }
}

export function setMockUser(username: string): MockUser {
  const normalizedUsername = username.trim().toLowerCase();
  const name = normalizedUsername || "Investor";
  const user = {
    username: normalizedUsername,
    name: name.charAt(0).toUpperCase() + name.slice(1),
  };

  if (isBrowser()) {
    const storedUser = JSON.stringify(user);
    cachedStoredUser = storedUser;
    cachedUser = user;
    window.localStorage.setItem(MOCK_AUTH_KEY, storedUser);
    window.dispatchEvent(new Event(MOCK_AUTH_CHANGE_EVENT));
  }

  return user;
}

export function clearMockUser() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(MOCK_AUTH_KEY);
  cachedStoredUser = null;
  cachedUser = null;
  window.dispatchEvent(new Event(MOCK_AUTH_CHANGE_EVENT));
}

export function subscribeMockAuth(callback: () => void) {
  if (!isBrowser()) return () => {};

  window.addEventListener(MOCK_AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(MOCK_AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
