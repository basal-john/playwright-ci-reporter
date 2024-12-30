import {Reporter, TestCase, TestResult} from '@playwright/test/reporter';
import fs from 'fs';
import {colors} from './Colors';

const FAILURE_QUOTES = [
    '“Houston, we have a problem.” - Apollo 13',
    '“Failure is not an option.” - Apollo 13',
    '“Why so serious?” - The Dark Knight',
    '“I find your lack of passing disturbing.” - Darth Vader',
    "“It's not a bug, it's a feature!” - Every developer ever",
    'Oh, crap, it failed! But it worked on my machine!',
    "Tests won't fail if you have no tests!",
    'PLEASE LET ME MERGE BEFORE I START CRYING!',
    '“You can’t handle the truth!” - A Few Good Men',
];

const SUCCESS_QUOTES = [
    '“Hasta la vista, baby.” - The Terminator',
    '“All systems go!” - NASA',
    '“That’s one small step for man, one giant leap for… tests!” - Apollo 11',
    '“Victory is ours!” - Braveheart',
    "“I'm king of the world!” - Titanic",
    '“You’re a wizard, Harry!” - Harry Potter',
    '“Live long and prosper.” - Star Trek',
];

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
     * Returns a random quote from the provided list.
     * @param {string[]} quotes - Array of quotes to choose from.
     * @returns {string} A random quote.
     */
    private getRandomQuote(quotes: string[]): string {
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

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
            totalTimeSec < 60 ? `${totalTimeSec.toFixed(2)}s` : `${(totalTimeSec / 60).toFixed(2)}min`; // Convert to min only if >= 60s

        let passedCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let testCount = 0;
        let totalRetries = 0;
        const failures: {
            title: string;
            message: string;
            stack: string;
            timeTaken: number;
            isTimeout: boolean;
        }[] = [];
        const passedDurations: number[] = [];

        // Process final outcomes
        for (const {test, attempts} of this.testRecords.values()) {
            testCount++;
            const finalOutcome = test.outcome();
            const finalAttempt = attempts[attempts.length - 1];

            // Count retries if multiple attempts were made
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

        // Compute average + slowest durations
        const averageTime =
            passedDurations.length > 0 ? passedDurations.reduce((a, b) => a + b, 0) / passedDurations.length : 0;
        const slowestTest = passedDurations.length > 0 ? Math.max(...passedDurations) : 0;

        // Compute the top 3 slowest tests
        const slowestTests = Array.from(this.testRecords.values())
            .flatMap(({ test, attempts }) =>
                attempts
                    .filter((a) => a.status === 'passed')
                    .map((a) => ({ title: test.title, duration: a.duration }))
            )
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 3);

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
                        `${colors.reset}  ${index + 1}. ${test.title}:${colors.reset} ${colors.fgYellow}${test.duration.toFixed(2)}s${colors.reset}`
                    );
                });
            }
            console.log(`${colors.fgMagenta}- Total retries: ${totalRetries}${colors.reset}`);

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
            console.log(`${colors.fgRed}"${this.getRandomQuote(FAILURE_QUOTES)}"${colors.reset}`);

            this.writeJsonSummary(
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
            );
            process.exit(1);
        } else {
            console.log(
                `${colors.fgGreen}✅ All ${testCount} tests passed | ⏱ Total: ${totalTimeDisplay}${colors.reset}`,
            );
            console.log(`${colors.fgMagenta}- Average passed test time: ${averageTime.toFixed(2)}s${colors.reset}`);
            if (slowestTest > 0) {
                console.log(`${colors.fgMagenta}- Slowest test took: ${slowestTest.toFixed(2)}s${colors.reset}`);
            }
            console.log(`${colors.fgMagenta}- Total retries: ${totalRetries}${colors.reset}`);
            console.log(`${colors.fgGreen}"${this.getRandomQuote(SUCCESS_QUOTES)}"${colors.reset}`);

            this.writeJsonSummary(
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
            );
            process.exit(0);
        }
    }

    /**
     * Writes a JSON summary of the test results to a file.
     * @param {number} endTime - The end time of the test run.
     * @param {number} totalTimeSec - The total time taken for the test run in seconds.
     * @param {number} averageTime - The average duration of passed tests in seconds.
     * @param {number} slowestTest - The duration of the slowest test in seconds.
     * @param {number} totalTests - The total number of tests run.
     * @param {number} passed - The number of tests that passed.
     * @param {number} failed - The number of tests that failed.
     * @param {number} skipped - The number of tests that were skipped.
     * @param {number} totalRetries - The total number of retries across all tests.
     * @param {any[]} failures - An array of failure details.
     */
    private writeJsonSummary(
        endTime: number,
        totalTimeSec: number,
        averageTime: number,
        slowestTest: number,
        totalTests: number,
        passed: number,
        failed: number,
        skipped: number,
        totalRetries: number,
        failures: any[],
    ) {
        const summary = {
            startTime: this.startTime,
            endTime,
            totalTimeSeconds: totalTimeSec,
            totalTests,
            passed,
            failed,
            skipped,
            failures,
            averageTestDurationSeconds: averageTime,
            slowestTestDurationSeconds: slowestTest,
            totalRetries,
            environmentUrl: this.environmentUrl,
        };

        fs.writeFileSync('test-results.json', JSON.stringify(summary, null, 2));
    }
}
