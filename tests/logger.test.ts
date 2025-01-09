import {Logger} from '../src/utils';
import {TestSummary, TestFailure} from '../src/types';

describe('Logger', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleGroupSpy: jest.SpyInstance;
    let consoleGroupEndSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
        consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('logSummary', () => {
        it('should log successful test summary correctly', () => {
            const summary: TestSummary = {
                failures: [],
                testCount: 3,
                passedCount: 3,
                skippedCount: 0,
                totalTimeDisplay: '1.23s',
                averageTime: 0.41,
                slowestTest: 0.5,
                slowestTests: [
                    {title: 'Test 1', duration: 0.5},
                    {title: 'Test 2', duration: 0.4},
                ],
            };

            Logger.logSummary(summary);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅ All 3 tests passed'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1.23s'));
        });

        it('should log failed test summary correctly', () => {
            const summary: TestSummary = {
                failures: [
                    {title: 'Failed Test', message: 'Error', stack: 'Stack trace', timeTaken: 1, isTimeout: false},
                ],
                testCount: 3,
                passedCount: 2,
                skippedCount: 0,
                totalTimeDisplay: '1.23s',
                averageTime: 0.41,
                slowestTest: 0.5,
                slowestTests: [],
            };

            Logger.logSummary(summary);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('❌ 1 of 3 tests failed'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('2 passed'));
        });

        it('should show warning for skipped tests', () => {
            const summary: TestSummary = {
                failures: [],
                testCount: 3,
                passedCount: 2,
                skippedCount: 1,
                totalTimeDisplay: '1.23s',
                averageTime: 0.41,
                slowestTest: 0.5,
                slowestTests: [],
            };

            Logger.logSummary(summary);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1 test was skipped'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Please ensure to test'));
        });
    });

    describe('logMetrics', () => {
        it('should log metrics correctly', () => {
            const summary: TestSummary = {
                failures: [],
                testCount: 3,
                passedCount: 3,
                skippedCount: 0,
                totalTimeDisplay: '1.23s',
                averageTime: 0.41,
                slowestTest: 0.5,
                slowestTests: [
                    {title: 'Slow Test', duration: 0.5},
                    {title: 'Medium Test', duration: 0.4},
                ],
            };

            Logger.logMetrics(summary);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Average passed test time: 0.41s'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Slowest test took: 0.50s'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Top 3 slowest tests'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('  1. Slow Test:'));
        });

        it('should not show slowest tests section if no slow tests', () => {
            const summary: TestSummary = {
                failures: [],
                testCount: 3,
                passedCount: 3,
                skippedCount: 0,
                totalTimeDisplay: '1.23s',
                averageTime: 0.41,
                slowestTest: 0,
                slowestTests: [],
            };

            Logger.logMetrics(summary);

            expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Top 3 slowest tests'));
        });
    });

    describe('logFailures', () => {
        it('should log failures correctly', () => {
            const failures: TestFailure[] = [
                {
                    title: 'Failed Test',
                    message: 'Error message',
                    stack: 'Stack trace',
                    timeTaken: 1,
                    isTimeout: false,
                },
            ];

            Logger.logFailures(failures);

            expect(consoleGroupSpy).toHaveBeenCalledWith(expect.stringContaining('Failure #1'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Failed Test'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Stack trace'));
            expect(consoleGroupEndSpy).toHaveBeenCalled();
        });

        it('should indicate timeout failures', () => {
            const failures: TestFailure[] = [
                {
                    title: 'Timeout Test',
                    message: 'Timeout',
                    stack: 'Stack trace',
                    timeTaken: 1,
                    isTimeout: true,
                },
            ];

            Logger.logFailures(failures);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('timeout'));
        });
    });
});
