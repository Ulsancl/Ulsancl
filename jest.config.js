module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1'
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
    },
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
        '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)'
    ],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/main.jsx',
        '!src/vite-env.d.ts'
    ]
}
