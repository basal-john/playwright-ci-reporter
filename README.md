# **Playwright CI Reporter**

A modern, maintainable custom reporter for Playwright tests that enhances your test output with colorized results, comprehensive metrics, and intelligent failure analysis. Perfect for CI/CD pipelines and local development.

## **✨ Features**

-   🎨 **Smart Colorized Output**:

    -   ✅ Passed tests (Green)
    -   ❌ Failed tests (Red)
    -   🔄 Retry attempts (Yellow)
    -   ⚠️ Skipped tests (Gray)
    -   🚀 Test run status (Cyan)

-   📊 **Comprehensive Metrics**:

    -   Total execution time with smart formatting
    -   Average test duration analysis
    -   Slowest test identification
    -   Top slowest tests ranking
    -   Pass/fail/skip statistics

-   🛠 **Advanced Features**:

    -   Configurable slow test thresholds
    -   Timeout warnings
    -   Stack trace controls
    -   Retry attempt tracking
    -   Manual testing reminders for skipped tests

-   📝 **Intelligent Reporting**:
    -   Detailed failure analysis
    -   Clear error messages
    -   Formatted stack traces
    -   Test timing insights
    -   Skipped test warnings

## **🚀 Installation**

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

## **📋 Output Examples**

### **Successful Run**

```plaintext
🚀 Test run started!
✅ Login test passed in 1.23s
✅ API integration test passed in 2.45s
⚠️ Payment test was skipped

✅ All 3 tests passed | 1 skipped | ⏱ Total: 3.68s

Additional Metrics:
- Average passed test time: 1.84s
- Slowest test took: 2.45s
- Top 3 slowest tests:
  1. API integration test: 2.45s
  2. Login test: 1.23s

⚠️ Warning: 1 test was skipped.
   Please ensure to test the skipped scenarios manually before deployment.
```

### **Failed Run**

```plaintext
🚀 Test run started!
✅ Login test passed in 1.23s
❌ API test failed in 2.45s
🔄 Retry attempt for "API test" (failed) in 2.50s
⚠️ Payment test was skipped

❌ 1 of 3 tests failed | 1 passed | 1 skipped | ⏱ Total: 6.18s

Failures:
--- Failure #1 ---
  Test: API test
  Stack Trace:
    at Connection.connect (/src/api/connection.ts:45:7)
```

---

## **🤝 Contributing**

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch:
    ```bash
    git checkout -b feature/amazing-feature
    ```
3. Make your changes and commit them:
    ```bash
    git commit -m 'Add some amazing feature'
    ```
4. Push to your fork:
    ```bash
    git push origin feature/amazing-feature
    ```
5. Open a Pull Request

Please ensure your PR:

-   Follows the existing code style
-   Includes appropriate tests
-   Updates documentation as needed
-   Describes the changes made

---

## **📝 License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## **🙏 Acknowledgments**

-   Built with [Playwright](https://playwright.dev/)
-   Inspired by the need for better test reporting in CI/CD pipelines
-   Thanks to all contributors who help make this reporter better
