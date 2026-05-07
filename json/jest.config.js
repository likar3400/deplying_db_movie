module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  modulePathIgnorePatterns: ["<rootDir>/json/"], 
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
 transform: {
  '^.+\\.tsx?$': [
    'ts-jest',
    {
      useESM: true, 
      tsconfig: 'tsconfig.json' 
    },
  ],
},
};