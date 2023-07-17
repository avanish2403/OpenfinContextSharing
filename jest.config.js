module.exports = {
    preset: 'ts-jest',
    collectCoverage: true,
    collectCoverageFrom: ['./src/**'],
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['mock-local-storage'],
    moduleNameMapper: {
      '^.+\\.(css|less|gif|jpg|jpeg|svg|png)$': 'identity-obj-proxy',
      'src/(.*)': '<rootDir>/src/$1',
    },
  };
  