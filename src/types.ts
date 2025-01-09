import {TestCase, TestResult} from '@playwright/test/reporter';

export interface AttemptInfo {
    status: TestResult['status'];
    duration: number;
    errors: TestError[];
}

export interface TestError {
    message: string;
    stack?: string;
}

export interface TestRecord {
    test: TestCase;
    attempts: AttemptInfo[];
}

export interface TestSummary {
    failures: TestFailure[];
    testCount: number;
    passedCount: number;
    totalTimeDisplay: string;
    averageTime: number;
    slowestTest: number;
    slowestTests: SlowTest[];
}

export interface TestFailure {
    title: string;
    message: string;
    stack: string;
    timeTaken: number;
    isTimeout: boolean;
}

export interface SlowTest {
    title: string;
    duration: number;
}

export interface ReporterConfig {
    slowTestThreshold?: number; // in seconds
    maxSlowTestsToShow?: number;
    timeoutWarningThreshold?: number; // in seconds
    showStackTrace?: boolean;
}
