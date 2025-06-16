import { detectAndCleanXSS } from "./xssUtils";

describe("detectAndCleanXSS", () => {
    describe("Safe text handling", () => {
        it("should return clean text unchanged when no XSS is detected", () => {
            const safeText = "Welcome to our chat service!";
            const result = detectAndCleanXSS(safeText);
            
            expect(result.cleanText).toBe(safeText);
            expect(result.isXSSDetected).toBe(false);
        });

        it("should handle empty string", () => {
            const result = detectAndCleanXSS("");
            
            expect(result.cleanText).toBe("");
            expect(result.isXSSDetected).toBe(false);
        });

        it("should handle whitespace-only text", () => {
            const whitespaceText = "   \n\t  ";
            const result = detectAndCleanXSS(whitespaceText);
            
            expect(result.cleanText).toBe(whitespaceText);
            expect(result.isXSSDetected).toBe(false);
        });

        it("should handle special characters without XSS", () => {
            const specialText = "Contact us at support@example.com or call 123-456-7890!";
            const result = detectAndCleanXSS(specialText);
            
            expect(result.cleanText).toBe(specialText);
            expect(result.isXSSDetected).toBe(false);
        });
    });

    describe("JavaScript protocol detection", () => {
        it("should detect javascript: protocol", () => {
            const maliciousText = "Click here: javascript:alert(\"xss\")";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });

        it("should detect javascript: protocol with different casing", () => {
            const maliciousText = "Link: JAVASCRIPT:alert(1)";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });

        it("should detect vbscript: protocol", () => {
            const maliciousText = "vbscript:msgbox(\"xss\")";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });
    });

    describe("Event handler detection", () => {
        it("should detect onmouseover events", () => {
            const maliciousText = "Hello onmouseover=alert(\"xss\") world";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
            expect(result.cleanText).toBe("Hello  world");
        });

        it("should detect onclick events", () => {
            const maliciousText = "Button onclick=\"maliciousCode()\"";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });

        it("should detect onload events", () => {
            const maliciousText = "Image onload='executePayload()'";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });

        it("should detect various event handlers with spaces", () => {
            const maliciousText = "Test onfocus = \"attack()\" content";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });
    });

    describe("Script tag detection", () => {
        it("should detect script tags", () => {
            const maliciousText = "Hello <script>alert(\"xss\")</script> world";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
            expect(result.cleanText).toBe("Hello  world");
        });

        it("should detect script tags with different casing", () => {
            const maliciousText = "Test <SCRIPT>malicious()</SCRIPT>";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });

        it("should detect script tags with attributes", () => {
            const maliciousText = "<script type=\"text/javascript\">evil()</script>";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });
    });

    describe("CSS-based attacks detection", () => {
        it("should detect CSS expression() attacks", () => {
            const maliciousText = "style=\"color: expression(alert('xss'))\"";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });

        it("should detect CSS url() attacks", () => {
            const maliciousText = "background: url(javascript:alert(1))";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });

        it("should detect position:fixed attacks", () => {
            const maliciousText = "style=\"position:fixed;top:0;left:0\"";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });

        it("should detect position:absolute attacks", () => {
            const maliciousText = "div style=\"position: absolute; z-index: 9999\"";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });
    });

    describe("Data URL detection", () => {
        it("should detect data:text/html URLs", () => {
            const maliciousText = "src=\"data:text/html,<script>alert(1)</script>\"";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });
    });

    describe("Encoded attacks detection", () => {
        it("should detect HTML entity encoded attacks", () => {
            const maliciousText = "&lt;script&gt;alert(\"xss\")&lt;/script&gt;";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });

        it("should detect fragment with escaped quotes", () => {
            const maliciousText = "https://example.com#\\\"onload=alert(1)";
            const result = detectAndCleanXSS(maliciousText);
            
            expect(result.isXSSDetected).toBe(true);
        });
    });

    describe("Complex attack scenarios", () => {
        it("should detect the specific attack pattern from the example", () => {
            const attackPattern = "https://attacker-server.com/#\\\"/style=\\\"display:block;position:fixed;top:0;bottom:0;right:0;left:0;color:#00000000;\\\"/onmouseover=alert(document.domain)&gt;";
            const result = detectAndCleanXSS(attackPattern);
            
            expect(result.isXSSDetected).toBe(true);
            // Should remove the malicious parts
            expect(result.cleanText).not.toContain("onmouseover");
            expect(result.cleanText).not.toContain("position:fixed");
        });

        it("should handle multiple XSS patterns in one string", () => {
            const multipleAttacks = "javascript:alert(1) <script>evil()</script> onmouseover=\"attack()\"";
            const result = detectAndCleanXSS(multipleAttacks);
            
            expect(result.isXSSDetected).toBe(true);
            expect(result.cleanText).not.toContain("javascript:");
            expect(result.cleanText).not.toContain("<script>");
            expect(result.cleanText).not.toContain("onmouseover");
        });

        it("should preserve legitimate content while removing XSS", () => {
            const mixedContent = "Welcome to our service! <script>alert(\"xss\")</script> Contact us at support@example.com";
            const result = detectAndCleanXSS(mixedContent);
            
            expect(result.isXSSDetected).toBe(true);
            expect(result.cleanText).toContain("Welcome to our service!");
            expect(result.cleanText).toContain("Contact us at support@example.com");
            expect(result.cleanText).not.toContain("<script>");
        });
    });

    describe("Edge cases and boundary conditions", () => {
        it("should handle very long strings", () => {
            const longSafeText = "a".repeat(10000);
            const result = detectAndCleanXSS(longSafeText);
            
            expect(result.cleanText).toBe(longSafeText);
            expect(result.isXSSDetected).toBe(false);
        });

        it("should handle strings with only XSS content", () => {
            const onlyXSS = "<script>alert(\"xss\")</script>";
            const result = detectAndCleanXSS(onlyXSS);
            
            expect(result.isXSSDetected).toBe(true);
            expect(result.cleanText).toBe("");
        });

        it("should handle Unicode characters", () => {
            const unicodeText = "Hello 世界! Welcome 🌍";
            const result = detectAndCleanXSS(unicodeText);
            
            expect(result.cleanText).toBe(unicodeText);
            expect(result.isXSSDetected).toBe(false);
        });

        it("should handle null and undefined-like strings", () => {
            const nullString = "null";
            const undefinedString = "undefined";
            
            const nullResult = detectAndCleanXSS(nullString);
            const undefinedResult = detectAndCleanXSS(undefinedString);
            
            expect(nullResult.cleanText).toBe("null");
            expect(nullResult.isXSSDetected).toBe(false);
            expect(undefinedResult.cleanText).toBe("undefined");
            expect(undefinedResult.isXSSDetected).toBe(false);
        });
    });

    describe("Return value structure", () => {
        it("should always return an object with cleanText and isXSSDetected properties", () => {
            const result = detectAndCleanXSS("test");
            
            expect(typeof result).toBe("object");
            expect(result).toHaveProperty("cleanText");
            expect(result).toHaveProperty("isXSSDetected");
            expect(typeof result.cleanText).toBe("string");
            expect(typeof result.isXSSDetected).toBe("boolean");
        });
    });
});
