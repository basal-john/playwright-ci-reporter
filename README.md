# **Playwright CI Reporter**

A CI-friendly custom reporter for Playwright tests, providing enhanced logging, failure summaries, and a touch of humor. This reporter makes debugging and tracking test results easier while adding some personality to your test logs.

---

- 🎨 **Colorized Output**:

    - ✅ Passed tests (Green)
    - ❌ Failed tests (Red)
    - 🔄 Retry attempts (Yellow)
    - ⚠️ Skipped tests (Gray)

- 📊 **Detailed Metrics**:
    - Total test execution time
    - Average test duration
    - Slowest test identification
    - Top slowest tests list
    - Pass/fail statistics

## **Installation**

Install the package using npm:

```bash
npm install playwright-ci-reporter
```

---

## **Usage**

Integrate the `playwright-ci-reporter` into your Playwright configuration file (`playwright.config.ts`):

```typescript
import {defineConfig} from '@playwright/test';

export default defineConfig({
    testDir: './tests', // Adjust to your test directory
    retries: 2, // Example of using retries
    reporter: [['playwright-ci-reporter']],
    use: {
        trace: 'on-first-retry', // Example: trace only on retries
        video: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
});
```

---

## **Example Logs**

### **When Tests Pass**

```plaintext
✅ Audit accessibility violations on the footer in 7.08s
✅ Audit accessibility violations on Customer Center Login with active in 6.83s

✅ All 9 tests passed | ⏱ Total: 13.28s
- Average passed test time: 6.30s
- Slowest test took: 12.34s
"“All systems go!” - NASA"
```

### **When Tests Fail**

```plaintext
❌ Audit accessibility violations on MyThomann Login Page with active failed in 1.54s
🔄 Retry attempt for "Audit accessibility violations on MyThomann Login Page with active" (failed) in 1.62s


❌ 1 of 9 tests failed | 8 passed | ⏱ Total: 12.88s

❌ Summary of Failures:

Failure #1
🚨 Test: Audit accessibility violations on the footer
⏱ Time Taken: 5.36s
📜 Error Message: expect(received).toBe(expected) // Object.is equality
📜 Stack Trace:
Error: expect(received).toBe(expected) // Object.is equality
    at /path/to/test/file.test.ts:20:28

“I find your lack of passing disturbing.” - Darth Vader
```

---

## **Configuration**

### **Reporter Options**

This reporter logs:

1. **Test Status**: Indicates whether a test has passed or failed.
2. **Execution Time**: Logs how long each test took to execute.
3. **Failure Summary**: Provides detailed information for failed tests, including:
    - Error message
    - Stack trace
    - Execution time

### **Output**

- **Console**: Real-time logs during test execution.
- **File**: Logs saved to `logs/info.log` (default location).

---

## **Customization**

If you wish to modify the behavior of this reporter, you can fork the repository or create your own implementation based on this package.

---

## **Development**

To work on this package locally:

1. Clone the repository:

    ```bash
    git clone https://github.com/basal-john/playwright-ci-reporter.git
    cd playwright-ci-reporter
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Build the package:

    ```bash
    npm run build
    ```

4. Test it locally by linking it to another project:

    ```bash
    npm link
    cd /path/to/your/playwright-project
    npm link playwright-ci-reporter
    ```

5. Run tests in the Playwright project to verify the reporter:
    ```bash
    npx playwright test
    ```

---

## **Future Enhancements**

- Add configurable output formats (e.g., JSON, HTML).
- Support custom quotes or log formats.
- Add support for other test runners (e.g., Jest, Mocha).

---

## **Contributing**

Contributions are welcome! If you’d like to report a bug, suggest a feature, or contribute to the codebase, feel free to open an issue or submit a pull request.

---

## **License**

This package is licensed under the [MIT License](LICENSE).
