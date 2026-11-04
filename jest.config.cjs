/** Tests fuer die Oberflaeche (Server: node --test server.test.mjs) */
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.tsx'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', esModuleInterop: true, module: 'commonjs' }, diagnostics: false }] },
};
