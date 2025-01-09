import {TestCase, TestResult} from '@playwright/test/reporter';

/**
 * Represents information about a single test attempt.
 * This includes the test status, duration, and any errors that occurred.
 */
export interface AttemptInfo {
    /** The final status of the test attempt (passed, failed, skipped, etc.) */
    status: TestResult['status'];
    /** Duration of the test attempt in seconds */
    duration: number;
    /** Array of errors that occurred during the test attempt */
    errors: TestError[];
}

/**
 * Represents an error that occurred during test execution.
 */
export interface TestError {
    /** The error message */
    message: string;
    /** Optional stack trace of the error */
    stack?: string;
}

/**
 * Represents a complete record of a test case and all its attempts.
 * This is used to track retries and maintain test history.
 */
export interface TestRecord {
    /** The test case being tracked */
    test: TestCase;
    /** Array of all attempts made to run this test */
    attempts: AttemptInfo[];
}

/**
 * Represents a complete summary of the test run results.
 * This includes statistics about passed, failed, and skipped tests,
 * as well as timing information.
 */
export interface TestSummary {
    /** Array of test failures with detailed information */
    failures: TestFailure[];
    /** Total number of tests executed */
    testCount: number;
    /** Number of tests that passed */
    passedCount: number;
    /** Number of tests that were skipped */
    skippedCount: number;
    /** Formatted string of total test execution time */
    totalTimeDisplay: string;
    /** Average time taken by passed tests */
    averageTime: number;
    /** Duration of the slowest test in seconds */
    slowestTest: number;
    /** Array of the slowest tests with their durations */
    slowestTests: SlowTest[];
}

/**
 * Represents detailed information about a test failure.
 */
export interface TestFailure {
    /** Title of the failed test */
    title: string;
    /** Error message from the failure */
    message: string;
    /** Stack trace of the failure */
    stack: string;
    /** Time taken by the failed test in seconds */
    timeTaken: number;
    /** Whether the failure was due to a timeout */
    isTimeout: boolean;
}

/**
 * Represents information about a slow test.
 * Used for reporting tests that took longer than expected.
 */
export interface SlowTest {
    /** Title of the slow test */
    title: string;
    /** Duration of the test in seconds */
    duration: number;
}

/**
 * Configuration options for the custom reporter.
 * All fields are optional and have default values.
 */
export interface ReporterConfig {
    /** Threshold in seconds after which a test is considered slow */
    slowTestThreshold?: number;
    /** Maximum number of slow tests to show in the report */
    maxSlowTestsToShow?: number;
    /** Threshold in seconds after which to show a timeout warning */
    timeoutWarningThreshold?: number;
    /** Whether to show stack traces in error reports */
    showStackTrace?: boolean;
}
