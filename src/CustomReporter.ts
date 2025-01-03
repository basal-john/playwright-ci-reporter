import {Reporter, TestCase, TestResult} from '@playwright/test/reporter';
import {colors} from './Colors';
import {getRandomQuote, FAILURE_QUOTES, SUCCESS_QUOTES} from './Quotes';

/**
 * Holds information about a single test attempt.
 */
interface AttemptInfo {
    status: TestResult['status'];
    duration: number;
    errors: {message: string; stack?: string}[];
}

/**
 * Tracks a particular test and all of its attempt data.
 */
interface TestRecord {
    test: TestCase;
    attempts: AttemptInfo[];
}

/**
 * Custom reporter for Playwright tests.
 */
export default class CustomReporterConfig implements Reporter {
    private _testRecords = new Map<string, TestRecord>();
    private _startTime: number = 0;

    /**
     * Called when the test run begins.
     */
    public onBegin(): void {
        console.log(`${colors.fgCyan}🚀 Test run started!${colors.reset}`);
        this._startTime = Date.now();
    }

    /**
     * Called when an error occurs during setup or runtime.
     * @param error The error that occurred.
     */
    public onError(error: Error): void {
        console.error(`${colors.fgRed}❌ Setup or runtime error: ${error.message}${colors.reset}`);
        if (error.stack) {
            console.error(`${colors.fgRed}${error.stack}${colors.reset}`);
        }
    }

    /**
     * Called when a test ends.
     * @param test   The test case that ended.
     * @param result The result of the test case.
     */
    public onTestEnd(test: TestCase, result: TestResult): void {
        const title = test.title;
        const timeTakenSec = result.duration / 1000;
        const timeTakenFormatted = timeTakenSec.toFixed(2);

        // If this is the first attempt for this test, initialize its record.
        if (!this._testRecords.has(title)) {
            this._testRecords.set(title, {test, attempts: []});
        }

        const testRecord = this._testRecords.get(title)!;
        testRecord.attempts.push({
            status: result.status,
            duration: timeTakenSec,
            errors: result.errors.map((e) => ({
                message: e.message || 'No error message',
                stack: e.stack,
            })),
        });

        // Log the outcome for this test attempt.
        switch (result.status) {
            case 'passed':
                if (result.retry > 0) {
                    console.log(
                        `${colors.fgGreen}✅ Retried and passed: ${title} in ${timeTakenFormatted}s${colors.reset}`,
                    );
                } else {
                    console.log(`${colors.fgGreen}✅ ${title} in ${timeTakenFormatted}s${colors.reset}`);
                }
                break;

            case 'failed':
            case 'timedOut':
                if (result.retry > 0) {
                    console.log(
                        `${colors.fgYellow}🔄 Retry attempt for "${title}" (${result.status}) in ${timeTakenFormatted}s${colors.reset}`,
                    );
                } else {
                    console.log(`${colors.fgRed}❌ ${title} failed in ${timeTakenFormatted}s${colors.reset}`);
                }
                break;

            case 'skipped':
                console.log(`${colors.fgYellow}⚠️ ${title} was skipped.${colors.reset}`);
                break;
        }
    }

    /**
     * Called when the entire test run ends.
     */
    public onEnd(): void {
        const endTime = Date.now();
        const totalTimeSec = (endTime - this._startTime) / 1000;
        const totalTimeDisplay =
            totalTimeSec < 60 ? `${totalTimeSec.toFixed(2)}s` : `${(totalTimeSec / 60).toFixed(2)}min`;

        // Collect and process results from all tests
        const {passedCount, testCount, failures, passedDurations} = this._processTestResults();

        // Handle the case where no tests were found
        if (testCount === 0) {
            console.log(`${colors.fgRed}❌ No tests found${colors.reset}`);
            process.exit(1);
        }

        // Compute stats
        const averageTime = this._computeAverageTime(passedDurations);
        const slowestTest = this._computeSlowestTest(passedDurations);
        const slowestTests = this._computeTopSlowestTests();

        // Log summary information
        this._logSummary({
            failures,
            testCount,
            passedCount,
            totalTimeDisplay,
            averageTime,
            slowestTest,
            slowestTests,
        });

        // Decide exit code based on whether there were failures
        if (failures.length > 0) {
            this._logFailures(failures);
            console.log(`${colors.fgRed}"${getRandomQuote(FAILURE_QUOTES)}"${colors.reset}`);
            process.exit(1);
        } else {
            console.log(`${colors.fgGreen}"${getRandomQuote(SUCCESS_QUOTES)}"${colors.reset}`);
            process.exit(0);
        }
    }

    // ───────────── Private Helper Methods ─────────────

    /**
     * Aggregate final test results (passed/failed/skipped) and gather additional data.
     */
    private _processTestResults() {
        let passedCount = 0;
        let testCount = 0;

        const failures: {
            title: string;
            message: string;
            stack: string;
            timeTaken: number;
            isTimeout: boolean;
        }[] = [];

        const passedDurations: number[] = [];

        // Loop through the recorded tests
        for (const {test, attempts} of this._testRecords.values()) {
            testCount++;
            const finalOutcome = test.outcome();
            const finalAttempt = attempts[attempts.length - 1];

            // Handle pass/flaky
            if (finalOutcome === 'expected' || finalOutcome === 'flaky') {
                passedCount++;
                passedDurations.push(...attempts.filter((a) => a.status === 'passed').map((a) => a.duration));
            }
            // Handle failed
            else if (finalOutcome === 'unexpected') {
                const isTimeout = finalAttempt.errors.some((e) => e.message.includes('timeout'));
                const combinedStack = finalAttempt.errors.map((e) => e.stack || '').join('\n');

                failures.push({
                    title: test.title,
                    message: '',
                    stack: combinedStack,
                    timeTaken: finalAttempt.duration,
                    isTimeout,
                });
            }
            // If test is skipped, do nothing special for it
        }

        return {
            passedCount,
            testCount,
            failures,
            passedDurations,
        };
    }

    /**
     * Computes average time from a list of durations (in seconds).
     */
    private _computeAverageTime(passedDurations: number[]): number {
        if (passedDurations.length === 0) return 0;
        const total = passedDurations.reduce((sum, duration) => sum + duration, 0);
        return total / passedDurations.length;
    }

    /**
     * Finds the slowest test duration (maximum) among passed tests.
     */
    private _computeSlowestTest(passedDurations: number[]): number {
        if (passedDurations.length === 0) return 0;
        return Math.max(...passedDurations);
    }

    /**
     * Gets the top 3 slowest passing tests.
     */
    private _computeTopSlowestTests() {
        return Array.from(this._testRecords.values())
            .flatMap(({test, attempts}) =>
                attempts
                    .filter((a) => a.status === 'passed')
                    .map((a) => ({
                        title: test.title,
                        duration: a.duration,
                    })),
            )
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 3);
    }

    /**
     * Logs a high-level summary of the test run.
     */
    private _logSummary({
        failures,
        testCount,
        passedCount,
        totalTimeDisplay,
        averageTime,
        slowestTest,
        slowestTests,
    }: {
        failures: any[];
        testCount: number;
        passedCount: number;
        totalTimeDisplay: string;
        averageTime: number;
        slowestTest: number;
        slowestTests: {title: string; duration: number}[];
    }) {
        console.log(`\n`);
        // If there were failures, list them out
        if (failures.length > 0) {
            console.log(
                `${colors.fgRed}❌ ${failures.length} of ${testCount} tests failed | ${passedCount} passed | ⏱ Total: ${totalTimeDisplay}${colors.reset}`,
            );
        } else {
            // All tests passed
            console.log(
                `${colors.fgGreen}✅ All ${testCount} tests passed | ⏱ Total: ${totalTimeDisplay}${colors.reset}`,
            );
        }

        // Always show extra metrics
        console.log(`${colors.fgMagenta}\nAdditional Metrics:${colors.reset}`);
        console.log(`${colors.fgMagenta}- Average passed test time: ${averageTime.toFixed(2)}s${colors.reset}`);

        // If there's at least one passing test, show the slowest test info
        if (slowestTest > 0) {
            console.log(`${colors.fgMagenta}- Slowest test took: ${slowestTest.toFixed(2)}s${colors.reset}`);
            console.log(`${colors.fgMagenta}- Top 3 slowest tests:${colors.reset}`);
            slowestTests.forEach((test, index) => {
                console.log(
                    `${colors.reset}  ${index + 1}. ${test.title}: ` +
                        `${colors.fgYellow}${test.duration.toFixed(2)}s${colors.reset}`,
                );
            });
        }
    }

    /**
     * Logs detailed information about any test failures.
     */
    private _logFailures(failures: any[]): void {
        console.log(`${colors.fgRed}\nFailures:${colors.reset}`);

        failures.forEach((failure, index) => {
            console.group(`--- Failure #${index + 1} ---`);
            console.log(`  Test: ${failure.title}`);
            if (failure.stack) {
                console.log(`  Stack Trace:\n${failure.stack}`);
            }
            if (failure.isTimeout) {
                console.log(`${colors.fgYellow}  (This failure involved a timeout.)${colors.reset}`);
            }
            console.groupEnd();
        });

        console.log(`${colors.fgRed}\n❌ Tests failed with exit code 1${colors.reset}`);
    }
}
