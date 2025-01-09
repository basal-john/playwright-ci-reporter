import {TestRecord, TestSummary, SlowTest, TestFailure} from './types';
import {colors} from './Colors';

export class TestUtils {
    static formatTime(timeInSeconds: number): string {
        return timeInSeconds < 60 ? `${timeInSeconds.toFixed(2)}s` : `${(timeInSeconds / 60).toFixed(2)}min`;
    }

    static calculateAverageTime(durations: number[]): number {
        return durations.length === 0 ? 0 : durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    }

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

    static processTestResults(testRecords: Map<string, TestRecord>): {
        passedCount: number;
        testCount: number;
        failures: TestFailure[];
        passedDurations: number[];
    } {
        let passedCount = 0;
        let testCount = 0;
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
            }
        }

        return {
            passedCount,
            testCount,
            failures,
            passedDurations,
        };
    }
}

export class Logger {
    static logSummary(summary: TestSummary): void {
        console.log('\n');

        if (summary.failures.length > 0) {
            console.log(
                `${colors.fgRed}❌ ${summary.failures.length} of ${summary.testCount} tests failed | ` +
                    `${summary.passedCount} passed | ⏱ Total: ${summary.totalTimeDisplay}${colors.reset}`,
            );
        } else {
            console.log(
                `${colors.fgGreen}✅ All ${summary.testCount} tests passed | ` +
                    `⏱ Total: ${summary.totalTimeDisplay}${colors.reset}`,
            );
        }

        this.logMetrics(summary);
    }

    static logMetrics(summary: TestSummary): void {
        console.log(`${colors.fgMagenta}\nAdditional Metrics:${colors.reset}`);
        console.log(`${colors.fgMagenta}- Average passed test time: ${summary.averageTime.toFixed(2)}s${colors.reset}`);

        if (summary.slowestTest > 0) {
            console.log(`${colors.fgMagenta}- Slowest test took: ${summary.slowestTest.toFixed(2)}s${colors.reset}`);
            console.log(`${colors.fgMagenta}- Top 3 slowest tests:${colors.reset}`);

            summary.slowestTests.forEach((test, index) => {
                console.log(
                    `${colors.reset}  ${index + 1}. ${test.title}: ` +
                        `${colors.fgYellow}${test.duration.toFixed(2)}s${colors.reset}`,
                );
            });
        }
    }

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
