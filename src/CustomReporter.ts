import {Reporter, TestCase, TestResult} from '@playwright/test/reporter';
import {colors} from './Colors';
import {getRandomQuote, FAILURE_QUOTES, SUCCESS_QUOTES} from './Quotes';
import {TestRecord, ReporterConfig, TestSummary} from './types';
import {TestUtils, Logger} from './utils';

/**
 * Modern, maintainable custom reporter for Playwright tests.
 */
export default class CustomReporterConfig implements Reporter {
    private readonly _testRecords = new Map<string, TestRecord>();
    private _startTime: number = 0;
    private readonly _config: Required<ReporterConfig>;

    constructor(config: ReporterConfig = {}) {
        this._config = {
            slowTestThreshold: config.slowTestThreshold ?? 5,
            maxSlowTestsToShow: config.maxSlowTestsToShow ?? 3,
            timeoutWarningThreshold: config.timeoutWarningThreshold ?? 30,
            showStackTrace: config.showStackTrace ?? true,
        };
    }

    public onBegin(): void {
        console.log(`${colors.fgCyan}🚀 Test run started!${colors.reset}`);
        this._startTime = Date.now();
    }

    public onError(error: Error): void {
        console.error(`${colors.fgRed}❌ Setup or runtime error: ${error.message}${colors.reset}`);
        if (error.stack && this._config.showStackTrace) {
            console.error(`${colors.fgRed}${error.stack}${colors.reset}`);
        }
    }

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

    public onEnd(): void {
        const endTime = Date.now();
        const totalTimeSec = (endTime - this._startTime) / 1000;
        const totalTimeDisplay = TestUtils.formatTime(totalTimeSec);

        // Process results
        const {passedCount, testCount, failures, passedDurations} = TestUtils.processTestResults(this._testRecords);

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
