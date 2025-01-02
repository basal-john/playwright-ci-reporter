import fs from 'fs';

/**
 * Writes a JSON summary of the test results to a file.
 * @param {number} startTime - The start time of the test run.
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
 * @param {string} environmentUrl - The environment URL used for the tests.
 */
export function writeJsonSummary(
    startTime: number,
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
    environmentUrl: string | undefined,
) {
    const summary = {
        startTime,
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
        environmentUrl,
    };

    fs.writeFileSync('test-results.json', JSON.stringify(summary, null, 2));
}
