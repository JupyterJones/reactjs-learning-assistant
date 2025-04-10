// filename: jest.config.ts
module.exports = {
  preset: 'ts-jest', // Use ts-jest for handling TypeScript files
  testEnvironment: 'jsdom', // Specify the testing environment
  transform: {
    '^.+\\.tsx?$': 'babel-jest', // Handle TypeScript files with Babel
    '^.+\\.js$': 'babel-jest', // Handle JavaScript files with Babel
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'], // File extensions to support
};
