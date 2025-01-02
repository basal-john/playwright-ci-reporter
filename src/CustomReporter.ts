import {Reporter, TestCase, TestResult} from '@playwright/test/reporter';
import {colors} from './Colors';
import {getRandomQuote, FAILURE_QUOTES, SUCCESS_QUOTES} from './Quotes';
import {writeJsonSummary} from './SummaryWriter';

interface AttemptInfo {
    status: TestResult['status'];
    duration: number;
    errors: {message: string; stack?: string}[];
}

interface TestRecord {
    test: TestCase;
    attempts: AttemptInfo[];
}

/**
 * Custom reporter for Playwright tests.
 */
export default class CustomReporterConfig implements Reporter {
    private testRecords = new Map<string, TestRecord>();
    private setupFailures: {message: string; stack?: string}[] = [];
    private startTime: number = 0;
    private environmentUrl: string | undefined = process.env.TEST_URL || '';

    /**
     * Called when the test run begins.
     */
    onBegin(): void {
        console.log(`${colors.fgCyan}🚀 Test run started!${colors.reset}`);
        if (this.environmentUrl) {
            console.log(`${colors.fgBlue}[INFO] Running tests against: ${this.environmentUrl}${colors.reset}`);
        }
        this.startTime = Date.now();
    }

    /**
     * Called when an error occurs during setup or runtime.
     * @param {Error} error - The error that occurred.
     */
    onError(error: Error): void {
        this.setupFailures.push({
            message: error.message,
            stack: error.stack,
        });
        console.error(`${colors.fgRed}❌ Setup or runtime error: ${error.message}${colors.reset}`);
        if (error.stack) {
            console.error(`${colors.fgRed}${error.stack}${colors.reset}`);
        }
    }

    /**
     * Called when a test ends.
     * @param {TestCase} test - The test case that ended.
     * @param {TestResult} result - The result of the test case.
     */
    onTestEnd(test: TestCase, result: TestResult): void {
        const title = test.title;
        const timeTakenSec = result.duration / 1000;
        const timeTakenFormatted = timeTakenSec.toFixed(2);

        if (!this.testRecords.has(title)) {
            this.testRecords.set(title, {
                test,
                attempts: [],
            });
        }

        const record = this.testRecords.get(title)!;
        record.attempts.push({
            status: result.status,
            duration: timeTakenSec,
            errors: result.errors.map((e) => ({
                message: e.message || 'No error message',
                stack: e.stack,
            })),
        });

        // Logging attempts
        if (result.status === 'passed') {
            if (result.retry > 0) {
                console.log(
                    `${colors.fgGreen}✅ Retried and passed: ${title} in ${timeTakenFormatted}s${colors.reset}`,
                );
            } else {
                console.log(`${colors.fgGreen}✅ ${title} in ${timeTakenFormatted}s${colors.reset}`);
            }
        } else if (result.status === 'failed' || result.status === 'timedOut') {
            if (result.retry > 0) {
                console.log(
                    `${colors.fgYellow}🔄 Retry attempt for "${title}" (${result.status}) in ${timeTakenFormatted}s${colors.reset}`,
                );
            } else {
                console.log(`${colors.fgRed}❌ ${title} failed in ${timeTakenFormatted}s${colors.reset}`);
            }
        } else if (result.status === 'skipped') {
            console.log(`${colors.fgYellow}⚠️ ${title} was skipped.${colors.reset}`);
        }
    }

    /**
     * Called when the test run ends.
     */
    onEnd(): void {
        const endTime = Date.now();
        const totalTimeSec = (endTime - this.startTime) / 1000;
        const totalTimeDisplay =
            totalTimeSec < 60 ? `${totalTimeSec.toFixed(2)}s` : `${(totalTimeSec / 60).toFixed(2)}min`;

        const {passedCount, failedCount, skippedCount, testCount, totalRetries, failures, passedDurations} =
            this.processTestResults();

        if (testCount === 0) {
            console.log(`${colors.fgRed}❌ No tests found${colors.reset}`);
            process.exit(1);
        }

        const averageTime = this.computeAverageTime(passedDurations);
        const slowestTest = this.computeSlowestTest(passedDurations);
        const slowestTests = this.computeTopSlowestTests();

        this.logSummary(
            failures,
            testCount,
            passedCount,
            totalTimeDisplay,
            averageTime,
            slowestTest,
            slowestTests,
            totalRetries,
        );

        if (failures.length > 0) {
            this.logFailures(failures);
            console.log(`${colors.fgRed}"${getRandomQuote(FAILURE_QUOTES)}"${colors.reset}`);
            writeJsonSummary(
                this.startTime,
                endTime,
                totalTimeSec,
                averageTime,
                slowestTest,
                testCount,
                passedCount,
                failedCount,
                skippedCount,
                totalRetries,
                failures,
                this.environmentUrl,
            );
            process.exit(1);
        } else {
            console.log(`${colors.fgGreen}"${getRandomQuote(SUCCESS_QUOTES)}"${colors.reset}`);
            writeJsonSummary(
                this.startTime,
                endTime,
                totalTimeSec,
                averageTime,
                slowestTest,
                testCount,
                passedCount,
                failedCount,
                skippedCount,
                totalRetries,
                [],
                this.environmentUrl,
            );
            process.exit(0);
        }
    }

    private processTestResults() {
        let passedCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let testCount = 0;
        let totalRetries = 0;
        const failures: {title: string; message: string; stack: string; timeTaken: number; isTimeout: boolean}[] = [];
        const passedDurations: number[] = [];

        for (const {test, attempts} of this.testRecords.values()) {
            testCount++;
            const finalOutcome = test.outcome();
            const finalAttempt = attempts[attempts.length - 1];
            const testRetries = attempts.length > 1 ? attempts.length - 1 : 0;
            totalRetries += testRetries;

            if (finalOutcome === 'expected' || finalOutcome === 'flaky') {
                passedCount++;
                passedDurations.push(...attempts.filter((a) => a.status === 'passed').map((a) => a.duration));
            } else if (finalOutcome === 'unexpected') {
                failedCount++;
                const isTimeout = finalAttempt.errors.some((e) => e.message.includes('timeout'));
                const combinedStack = finalAttempt.errors.map((e) => e.stack || '').join('\n');
                failures.push({
                    title: test.title,
                    message: '',
                    stack: combinedStack,
                    timeTaken: finalAttempt.duration,
                    isTimeout,
                });
            } else if (finalOutcome === 'skipped') {
                skippedCount++;
            }
        }

        return {passedCount, failedCount, skippedCount, testCount, totalRetries, failures, passedDurations};
    }

    private computeAverageTime(passedDurations: number[]): number {
        return passedDurations.length > 0 ? passedDurations.reduce((a, b) => a + b, 0) / passedDurations.length : 0;
    }

    private computeSlowestTest(passedDurations: number[]): number {
        return passedDurations.length > 0 ? Math.max(...passedDurations) : 0;
    }

    private computeTopSlowestTests() {
        return Array.from(this.testRecords.values())
            .flatMap(({test, attempts}) =>
                attempts.filter((a) => a.status === 'passed').map((a) => ({title: test.title, duration: a.duration})),
            )
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 3);
    }

    private logSummary(
        failures: any[],
        testCount: number,
        passedCount: number,
        totalTimeDisplay: string,
        averageTime: number,
        slowestTest: number,
        slowestTests: any[],
        totalRetries: number,
    ) {
        console.log(`\n`);
        if (failures.length > 0) {
            console.log(
                `${colors.fgRed}❌ ${failures.length} of ${testCount} tests failed | ${passedCount} passed | ⏱ Total: ${totalTimeDisplay}${colors.reset}`,
            );
            console.log(`${colors.fgMagenta}\nAdditional Metrics:${colors.reset}`);
            console.log(`${colors.fgMagenta}- Average passed test time: ${averageTime.toFixed(2)}s${colors.reset}`);
            if (slowestTest > 0) {
                console.log(`${colors.fgMagenta}- Slowest test took: ${slowestTest.toFixed(2)}s${colors.reset}`);
                console.log(`${colors.fgMagenta}- Top 3 slowest tests:${colors.reset}`);
                slowestTests.forEach((test, index) => {
                    console.log(
                        `${colors.reset}  ${index + 1}. ${test.title}:${colors.reset} ${colors.fgYellow}${test.duration.toFixed(2)}s${colors.reset}`,
                    );
                });
            }
            console.log(`${colors.fgMagenta}- Total retries: ${totalRetries}${colors.reset}`);
        } else {
            console.log(
                `${colors.fgGreen}✅ All ${testCount} tests passed | ⏱ Total: ${totalTimeDisplay}${colors.reset}`,
            );
            console.log(`${colors.fgMagenta}- Average passed test time: ${averageTime.toFixed(2)}s${colors.reset}`);
            if (slowestTest > 0) {
                console.log(`${colors.fgMagenta}- Slowest test took: ${slowestTest.toFixed(2)}s${colors.reset}`);
            }
            console.log(`${colors.fgMagenta}- Total retries: ${totalRetries}${colors.reset}`);
        }
    }

    private logFailures(failures: any[]) {
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
