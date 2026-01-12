import '@testing-library/jest-dom';

// Mock localStorage for tests
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

global.localStorage = localStorageMock;
