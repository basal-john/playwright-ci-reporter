import {TestRecord, TestSummary, SlowTest, TestFailure} from './Types';
import {colors} from './Colors';

/**
 * Utility class containing static methods for test result processing and calculations.
 * Provides functionality for formatting time, calculating statistics, and processing test results.
 */
export class TestUtils {
    /**
     * Formats a time duration from seconds into a human-readable string.
     * Converts to minutes if the duration is longer than 60 seconds.
     *
     * @param timeInSeconds - The time duration to format in seconds
     * @returns A formatted string with appropriate units (e.g., "1.23s" or "2.50min")
     */
    static formatTime(timeInSeconds: number): string {
        return timeInSeconds < 60 ? `${timeInSeconds.toFixed(2)}s` : `${(timeInSeconds / 60).toFixed(2)}min`;
    }

    /**
     * Calculates the average duration from an array of time measurements.
     *
     * @param durations - Array of durations in seconds
     * @returns The average duration in seconds, or 0 if the array is empty
     */
    static calculateAverageTime(durations: number[]): number {
        return durations.length === 0 ? 0 : durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    }

    /**
     * Finds the slowest tests from all test records.
     * Only considers passed tests when calculating the slowest ones.
     *
     * @param testRecords - Map of all test records
     * @param limit - Maximum number of slow tests to return
     * @returns Array of the slowest tests, sorted by duration
     */
    static findSlowestTests(testRecords: Map<string, TestRecord>, limit: number): SlowTest[] {
        return Array.from(testRecords.values())
            .flatMap(({test, attempts}) =>
                attempts
                    .filter((a) => a.status === 'passed')
                    .map((a) => ({
                        title: test.title,
                        duration: a.duration,
                    })),
            )
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }

    /**
     * Processes all test records to generate comprehensive test results.
     * Calculates passed, failed, and skipped test counts, and collects timing information.
     *
     * @param testRecords - Map of all test records
     * @returns Object containing test counts, failures, and timing information
     */
    static processTestResults(testRecords: Map<string, TestRecord>): {
        passedCount: number;
        testCount: number;
        skippedCount: number;
        failures: TestFailure[];
        passedDurations: number[];
    } {
        let passedCount = 0;
        let testCount = 0;
        let skippedCount = 0;
        const failures: TestFailure[] = [];
        const passedDurations: number[] = [];

        for (const {test, attempts} of testRecords.values()) {
            testCount++;
            const finalOutcome = test.outcome();
            const finalAttempt = attempts[attempts.length - 1];

            if (finalOutcome === 'expected' || finalOutcome === 'flaky') {
                passedCount++;
                passedDurations.push(...attempts.filter((a) => a.status === 'passed').map((a) => a.duration));
            } else if (finalOutcome === 'unexpected') {
                const isTimeout = finalAttempt.errors.some((e) => e.message.includes('timeout'));
                const combinedStack = finalAttempt.errors.map((e) => e.stack || '').join('\n');

                failures.push({
                    title: test.title,
                    message: finalAttempt.errors[0]?.message || '',
                    stack: combinedStack,
                    timeTaken: finalAttempt.duration,
                    isTimeout,
                });
            } else if (finalOutcome === 'skipped') {
                skippedCount++;
            }
        }

        return {
            passedCount,
            testCount,
            skippedCount,
            failures,
            passedDurations,
        };
    }
}

/**
 * Logger class responsible for formatting and outputting test results.
 * Provides methods for logging test summaries, metrics, and failures with appropriate formatting.
 */
export class Logger {
    /**
     * Logs the overall test run summary with appropriate coloring.
     * Includes total tests, passed tests, skipped tests, and total time.
     *
     * @param summary - The test summary to log
     */
    static logSummary(summary: TestSummary): void {
        console.log('\n');

        if (summary.failures.length > 0) {
            console.log(
                `${colors.fgRed}❌ ${summary.failures.length} of ${summary.testCount} tests failed | ` +
                    `${summary.passedCount} passed | ${summary.skippedCount} skipped | ⏱ Total: ${summary.totalTimeDisplay}${colors.reset}`,
            );
        } else {
            console.log(
                `${colors.fgGreen}✅ All ${summary.testCount} tests passed | ` +
                    `${summary.skippedCount} skipped | ⏱ Total: ${summary.totalTimeDisplay}${colors.reset}`,
            );
        }

        this.logMetrics(summary);

        // Add warning for skipped tests
        if (summary.skippedCount > 0) {
            console.log(
                `\n${colors.fgYellow}⚠️  Warning: ${summary.skippedCount} test${
                    summary.skippedCount === 1 ? ' was' : 's were'
                } skipped.${colors.reset}`,
            );
            console.log(
                `${colors.fgYellow}   Please ensure to test the skipped scenarios manually before deployment.${colors.reset}`,
            );
        }
    }

    /**
     * Logs detailed metrics about the test run.
     * Includes average test time and information about slow tests.
     *
     * @param summary - The test summary containing metrics to log
     */
    static logMetrics(summary: TestSummary): void {
        console.log(`${colors.fgMagenta}\nAdditional Metrics:${colors.reset}`);
        console.log(`${colors.fgMagenta}- Average passed test time: ${summary.averageTime.toFixed(2)}s${colors.reset}`);

        if (summary.slowestTest > 0) {
            console.log(`${colors.fgMagenta}- Slowest test took: ${summary.slowestTest.toFixed(2)}s${colors.reset}`);
            console.log(`${colors.fgMagenta}- Top 3 slowest tests:${colors.reset}`);

            summary.slowestTests.forEach((test, index) => {
                console.log(
                    `  ${index + 1}. ${test.title}: ` + `${colors.fgYellow}${test.duration.toFixed(2)}s${colors.reset}`,
                );
            });
        }
    }

    /**
     * Logs detailed information about test failures.
     * Includes test title, stack trace, and timeout information.
     *
     * @param failures - Array of test failures to log
     */
    static logFailures(failures: TestFailure[]): void {
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
