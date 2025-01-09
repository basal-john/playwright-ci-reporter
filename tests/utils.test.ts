import {TestUtils} from '../src/utils';
import {TestCase, TestResult} from '@playwright/test/reporter';
import {TestRecord} from '../src/types';

describe('TestUtils', () => {
    describe('formatTime', () => {
        it('should format time less than 60 seconds correctly', () => {
            expect(TestUtils.formatTime(45.678)).toBe('45.68s');
        });

        it('should format time more than 60 seconds as minutes', () => {
            expect(TestUtils.formatTime(123.456)).toBe('2.06min');
        });

        it('should handle zero correctly', () => {
            expect(TestUtils.formatTime(0)).toBe('0.00s');
        });
    });

    describe('calculateAverageTime', () => {
        it('should calculate average time correctly', () => {
            expect(TestUtils.calculateAverageTime([1, 2, 3, 4, 5])).toBe(3);
        });

        it('should return 0 for empty array', () => {
            expect(TestUtils.calculateAverageTime([])).toBe(0);
        });

        it('should handle single value', () => {
            expect(TestUtils.calculateAverageTime([5])).toBe(5);
        });
    });

    describe('findSlowestTests', () => {
        const mockTestCase = {title: 'Test'} as TestCase;
        const createTestRecord = (title: string, durations: number[]): [string, TestRecord] => [
            title,
            {
                test: {...mockTestCase, title},
                attempts: durations.map((duration) => ({
                    status: 'passed' as TestResult['status'],
                    duration,
                    errors: [],
                })),
            },
        ];

        it('should find and sort slowest tests correctly', () => {
            const testRecords = new Map([
                createTestRecord('Fast Test', [1]),
                createTestRecord('Slow Test', [5]),
                createTestRecord('Medium Test', [3]),
            ]);

            const slowestTests = TestUtils.findSlowestTests(testRecords, 3);
            expect(slowestTests).toHaveLength(3);
            expect(slowestTests[0].title).toBe('Slow Test');
            expect(slowestTests[1].title).toBe('Medium Test');
            expect(slowestTests[2].title).toBe('Fast Test');
        });

        it('should respect the limit parameter', () => {
            const testRecords = new Map([
                createTestRecord('Test 1', [1]),
                createTestRecord('Test 2', [2]),
                createTestRecord('Test 3', [3]),
            ]);

            const slowestTests = TestUtils.findSlowestTests(testRecords, 2);
            expect(slowestTests).toHaveLength(2);
        });

        it('should handle empty test records', () => {
            const slowestTests = TestUtils.findSlowestTests(new Map(), 3);
            expect(slowestTests).toHaveLength(0);
        });
    });

    describe('processTestResults', () => {
        const mockTestCase = {title: 'Test', outcome: () => 'expected'} as TestCase;
        const createTestRecord = (
            title: string,
            outcome: 'expected' | 'unexpected' | 'skipped' | 'flaky',
            error?: {message: string; stack?: string},
        ): [string, TestRecord] => [
            title,
            {
                test: {...mockTestCase, title, outcome: () => outcome},
                attempts: [
                    {
                        status: outcome === 'expected' ? 'passed' : outcome === 'unexpected' ? 'failed' : 'skipped',
                        duration: 1,
                        errors: error ? [error] : [],
                    },
                ],
            },
        ];

        it('should process passed tests correctly', () => {
            const testRecords = new Map([
                createTestRecord('Test 1', 'expected'),
                createTestRecord('Test 2', 'expected'),
            ]);

            const results = TestUtils.processTestResults(testRecords);
            expect(results.passedCount).toBe(2);
            expect(results.failures).toHaveLength(0);
            expect(results.skippedCount).toBe(0);
        });

        it('should process failed tests correctly', () => {
            const testRecords = new Map([
                createTestRecord('Test 1', 'unexpected', {message: 'Error', stack: 'Stack'}),
                createTestRecord('Test 2', 'expected'),
            ]);

            const results = TestUtils.processTestResults(testRecords);
            expect(results.passedCount).toBe(1);
            expect(results.failures).toHaveLength(1);
            expect(results.failures[0].title).toBe('Test 1');
        });

        it('should process skipped tests correctly', () => {
            const testRecords = new Map([
                createTestRecord('Test 1', 'skipped'),
                createTestRecord('Test 2', 'expected'),
            ]);

            const results = TestUtils.processTestResults(testRecords);
            expect(results.passedCount).toBe(1);
            expect(results.skippedCount).toBe(1);
        });

        it('should handle timeout failures', () => {
            const testRecords = new Map([createTestRecord('Test 1', 'unexpected', {message: 'timeout exceeded'})]);

            const results = TestUtils.processTestResults(testRecords);
            expect(results.failures[0].isTimeout).toBe(true);
        });
    });
});
