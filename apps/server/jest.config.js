/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/src/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^@prisma/client$': '<rootDir>/src/generated/prisma',
    '^@haircut-ms/shared$': '<rootDir>/../../packages/shared/src',
  },
  collectCoverageFrom: [
    'src/modules/**/*.service.ts',
    '!src/modules/**/*.module.ts',
    '!src/modules/**/*.controller.ts',
    '!src/modules/**/*.dto.ts',
    '!src/modules/**/*.guard.ts',
    '!src/modules/**/*.strategy.ts',
    '!src/modules/**/*.types.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    'src/modules/dashboard/',
    'src/modules/platform/',
    'src/modules/auth/',
    'src/modules/staff-stats/',
    'src/modules/service/',
    'src/modules/license/',
    'src/modules/recharge/',
    'src/modules/member/levels/',
    'src/modules/member/tags/',
    'src/modules/audit/',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 85,
      statements: 85,
    },
  },
};
