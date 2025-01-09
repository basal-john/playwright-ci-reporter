import CustomReporterConfig from '../src/CustomReporter';
import {TestCase, TestResult} from '@playwright/test/reporter';

describe('CustomReporterConfig', () => {
    let reporter: CustomReporterConfig;
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let processExitSpy: jest.SpyInstance;

    beforeEach(() => {
        reporter = new CustomReporterConfig({
            slowTestThreshold: 5,
            maxSlowTestsToShow: 3,
            timeoutWarningThreshold: 30,
            showStackTrace: true,
        });
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    // Helper functions
    const createMockTest = (title: string, outcome: string = 'expected'): TestCase => {
        const test = {
            title,
            titlePath: () => [title],
            outcome: () => outcome as any,
            ok: () => outcome === 'expected',
            results: [],
            expectedStatus: 'passed',
            timeout: 0,
            annotations: [],
            location: {file: '', line: 0, column: 0},
            id: '',
            repeatEachIndex: 0,
            retries: 0,
            parent: null,
            tags: [],
            type: 'test',
        } as unknown as TestCase;
        return test;
    };

    const createMockResult = (status: TestResult['status'], retry = 0): TestResult => ({
        status,
        duration: 1000,
        retry,
        startTime: new Date(),
        attachments: [],
        stdout: [],
        stderr: [],
        steps: [],
        errors: [],
        parallelIndex: 0,
        workerIndex: 0,
    });

    describe('onBegin', () => {
        it('should log start message', () => {
            reporter.onBegin();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test run started!'));
        });
    });

    describe('onError', () => {
        it('should log error message', () => {
            const error = new Error('Test error');
            reporter.onError(error);
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
        });

        it('should log stack trace when showStackTrace is true', () => {
            const error = new Error('Test error');
            reporter.onError(error);
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(error.stack!));
        });

        it('should not log stack trace when showStackTrace is false', () => {
            reporter = new CustomReporterConfig({showStackTrace: false});
            const error = new Error('Test error');
            reporter.onError(error);
            expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining(error.stack!));
        });
    });

    describe('onTestEnd', () => {
        it('should log passed test correctly', () => {
            const test = createMockTest('Test 1');
            const result = createMockResult('passed');

            reporter.onTestEnd(test, result);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Test 1'));
        });

        it('should log failed test correctly', () => {
            const test = createMockTest('Test 1', 'unexpected');
            const result = createMockResult('failed');

            reporter.onTestEnd(test, result);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Test 1 failed'));
        });

        it('should log skipped test correctly', () => {
            const test = createMockTest('Test 1', 'skipped');
            const result = createMockResult('skipped');

            reporter.onTestEnd(test, result);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️ Test 1 was skipped'));
        });

        it('should log retry attempt correctly', () => {
            const test = createMockTest('Test 1', 'unexpected');
            const result = createMockResult('failed', 1);

            reporter.onTestEnd(test, result);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🔄 Retry attempt'));
        });

        it('should warn about slow tests', () => {
            const test = createMockTest('Test 1');
            const result = {
                ...createMockResult('passed'),
                duration: 31000, // 31 seconds
            };

            reporter.onTestEnd(test, result);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Warning: Test'));
        });
    });

    describe('onEnd', () => {
        it('should handle no tests case', () => {
            reporter.onEnd();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No tests found'));
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });

        it('should log success message when all tests pass', () => {
            const test = createMockTest('Test 1');
            const result = createMockResult('passed');

            reporter.onTestEnd(test, result);
            reporter.onEnd();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅ All'));
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should log failure message when tests fail', () => {
            const test = createMockTest('Test 1', 'unexpected');
            const result = {
                ...createMockResult('failed'),
                errors: [{message: 'Failed', stack: 'stack'}],
            };

            reporter.onTestEnd(test, result);
            reporter.onEnd();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('❌'));
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });
    });
});
