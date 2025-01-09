import {Reporter, TestCase, TestResult, FullConfig, Suite} from '@playwright/test/reporter';
import {colors} from './Colors';
import {getRandomQuote, FAILURE_QUOTES, SUCCESS_QUOTES} from './Quotes';
import {TestRecord, ReporterConfig, TestSummary} from './types';
import {TestUtils, Logger} from './utils';

/**
 * CustomReporterConfig is a modern, maintainable reporter for Playwright tests.
 * It provides detailed, colorized output of test results with comprehensive metrics
 * and configurable options for better visibility into test execution.
 *
 * Features:
 * - Colorized output for different test states (passed, failed, skipped, retried)
 * - Detailed metrics including test duration and slow test identification
 * - Configurable thresholds for slow tests and timeouts
 * - Comprehensive error reporting with stack traces
 * - Support for test retries with clear status indication
 */
export default class CustomReporterConfig implements Reporter {
    private readonly _testRecords = new Map<string, TestRecord>();
    private _startTime: number = 0;
    private readonly _config: Required<ReporterConfig>;

    /**
     * Creates a new instance of the CustomReporterConfig.
     *
     * @param config - Optional configuration object to customize reporter behavior
     */
    constructor(config: ReporterConfig = {}) {
        this._config = {
            slowTestThreshold: config.slowTestThreshold ?? 5,
            maxSlowTestsToShow: config.maxSlowTestsToShow ?? 3,
            timeoutWarningThreshold: config.timeoutWarningThreshold ?? 30,
            showStackTrace: config.showStackTrace ?? true,
        };
    }

    /**
     * Called when the test run begins.
     * Initializes the start time and displays a start message.
     *
     * @param config - The full Playwright configuration
     * @param suite - The root test suite
     */
    public onBegin(config: FullConfig, suite: Suite): void {
        const totalTestCount = this._countTests(suite);
        console.log(
            `${colors.fgMagentaBright}🚀 Starting test run: ${totalTestCount} tests using ${config.workers} workers${colors.reset}`,
        );
        this._startTime = Date.now();
    }

    /**
     * Recursively counts the total number of tests in a suite and its children
     *
     * @param suite - The test suite to count tests from
     * @returns The total number of tests
     * @private
     */
    private _countTests(suite: Suite): number {
        let count = suite.tests.length;
        for (const childSuite of suite.suites) {
            count += this._countTests(childSuite);
        }
        return count;
    }

    /**
     * Called when an error occurs during test setup or teardown.
     * Logs the error with optional stack trace based on configuration.
     *
     * @param error - The error that occurred
     */
    public onError(error: Error): void {
        console.error(`${colors.fgRed}❌ Setup or runtime error: ${error.message}${colors.reset}`);
        if (error.stack && this._config.showStackTrace) {
            console.error(`${colors.fgRed}${error.stack}${colors.reset}`);
        }
    }

    /**
     * Called when a test completes (whether passed, failed, or skipped).
     * Records the test result and logs appropriate output based on the test status.
     *
     * @param test - The test case that completed
     * @param result - The result of the test execution
     */
    public onTestEnd(test: TestCase, result: TestResult): void {
        const title = test.title;
        const timeTakenSec = result.duration / 1000;

        // Initialize test record if first attempt
        if (!this._testRecords.has(title)) {
            this._testRecords.set(title, {test, attempts: []});
        }

        // Update test record with new attempt
        const testRecord = this._testRecords.get(title)!;
        testRecord.attempts.push({
            status: result.status,
            duration: timeTakenSec,
            errors: result.errors.map((e) => ({
                message: e.message || 'No error message',
                stack: e.stack,
            })),
        });

        // Log test outcome with appropriate formatting
        this._logTestOutcome(test.title, result, timeTakenSec);

        // Warn if test is taking longer than threshold
        if (timeTakenSec > this._config.timeoutWarningThreshold) {
            console.log(
                `${colors.fgYellow}⚠️ Warning: Test "${title}" is taking longer than ` +
                    `${this._config.timeoutWarningThreshold}s${colors.reset}`,
            );
        }
    }

    /**
     * Called when all tests have completed.
     * Processes results, displays summary statistics, and sets appropriate exit code.
     */
    public onEnd(): void {
        const endTime = Date.now();
        const totalTimeSec = (endTime - this._startTime) / 1000;
        const totalTimeDisplay = TestUtils.formatTime(totalTimeSec);

        // Process results
        const {passedCount, testCount, skippedCount, failures, passedDurations} = TestUtils.processTestResults(
            this._testRecords,
        );

        // Handle no tests case
        if (testCount === 0) {
            console.log(`${colors.fgRed}❌ No tests found${colors.reset}`);
            process.exit(1);
        }

        // Compute metrics
        const summary: TestSummary = {
            failures,
            testCount,
            passedCount,
            skippedCount,
            totalTimeDisplay,
            averageTime: TestUtils.calculateAverageTime(passedDurations),
            slowestTest: Math.max(...passedDurations, 0),
            slowestTests: TestUtils.findSlowestTests(this._testRecords, this._config.maxSlowTestsToShow),
        };

        // Log results
        Logger.logSummary(summary);

        if (failures.length > 0) {
            Logger.logFailures(failures);
            console.log(`${colors.fgRed}"${getRandomQuote(FAILURE_QUOTES)}"${colors.reset}`);
            process.exit(1);
        } else {
            console.log(`${colors.fgGreen}"${getRandomQuote(SUCCESS_QUOTES)}"${colors.reset}`);
            process.exit(0);
        }
    }

    /**
     * Formats and logs the outcome of a single test with appropriate coloring.
     * Handles different test states (passed, failed, skipped) and retry attempts.
     *
     * @param title - The title of the test
     * @param result - The result of the test execution
     * @param timeTakenSec - The time taken by the test in seconds
     * @private
     */
    private _logTestOutcome(title: string, result: TestResult, timeTakenSec: number): void {
        const timeTakenFormatted = timeTakenSec.toFixed(2);

        switch (result.status) {
            case 'passed':
                const passMessage = result.retry > 0 ? `✅ Retried and passed: ${title}` : `✅ ${title}`;
                console.log(`${colors.fgGreen}${passMessage} in ${timeTakenFormatted}s${colors.reset}`);
                break;

            case 'failed':
            case 'timedOut':
                const failMessage =
                    result.retry > 0 ? `🔄 Retry attempt for "${title}" (${result.status})` : `❌ ${title} failed`;
                const failColor = result.retry > 0 ? colors.fgYellow : colors.fgRed;
                console.log(`${failColor}${failMessage} in ${timeTakenFormatted}s${colors.reset}`);
                break;

            case 'skipped':
                console.log(`${colors.fgGray}⚠️ ${title} was skipped.${colors.reset}`);
                break;
        }
    }
}
