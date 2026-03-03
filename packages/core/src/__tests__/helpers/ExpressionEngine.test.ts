import { describe, it, expect } from "vitest";
import {
  evaluateExpression,
  extractExpressionDependencies,
} from "../../helpers/ExpressionEngine";

describe("ExpressionEngine", () => {
  describe("evaluateExpression", () => {
    it("evaluates arithmetic expressions with field references", () => {
      const values = { qty: 5, price: 10.5 };
      const result = evaluateExpression("$values.qty * $values.price", values);
      expect(result).toBe(52.5);
    });

    it("evaluates addition of numbers", () => {
      const values = { a: 3, b: 7 };
      expect(evaluateExpression("$values.a + $values.b", values)).toBe(10);
    });

    it("evaluates subtraction", () => {
      const values = { total: 100, discount: 15 };
      expect(evaluateExpression("$values.total - $values.discount", values)).toBe(85);
    });

    it("evaluates division", () => {
      const values = { total: 100, count: 4 };
      expect(evaluateExpression("$values.total / $values.count", values)).toBe(25);
    });

    it("evaluates string concatenation", () => {
      const values = { first: "John", last: "Doe" };
      const result = evaluateExpression(
        "$values.first + ' ' + $values.last",
        values
      );
      expect(result).toBe("John Doe");
    });

    it("evaluates comparison operators returning boolean", () => {
      const values = { a: 10, b: 5 };
      expect(evaluateExpression("$values.a > $values.b", values)).toBe(true);
      expect(evaluateExpression("$values.a < $values.b", values)).toBe(false);
      expect(evaluateExpression("$values.a >= $values.b", values)).toBe(true);
      expect(evaluateExpression("$values.a <= $values.b", values)).toBe(false);
      expect(evaluateExpression("$values.a === $values.b", values)).toBe(false);
      expect(evaluateExpression("$values.a !== $values.b", values)).toBe(true);
    });

    it("evaluates equality correctly", () => {
      const values = { a: 5, b: 5 };
      expect(evaluateExpression("$values.a === $values.b", values)).toBe(true);
    });

    it("evaluates Math.round", () => {
      const values = { total: 10.567 };
      const result = evaluateExpression(
        "Math.round($values.total * 100) / 100",
        values
      );
      expect(result).toBe(10.57);
    });

    it("evaluates Math.floor", () => {
      const values = { num: 4.9 };
      expect(evaluateExpression("Math.floor($values.num)", values)).toBe(4);
    });

    it("evaluates Math.ceil", () => {
      const values = { num: 4.1 };
      expect(evaluateExpression("Math.ceil($values.num)", values)).toBe(5);
    });

    it("evaluates Math.abs", () => {
      const values = { num: -42 };
      expect(evaluateExpression("Math.abs($values.num)", values)).toBe(42);
    });

    it("evaluates Math.min and Math.max", () => {
      const values = { a: 3, b: 7 };
      expect(evaluateExpression("Math.min($values.a, $values.b)", values)).toBe(3);
      expect(evaluateExpression("Math.max($values.a, $values.b)", values)).toBe(7);
    });

    it("handles null field values gracefully", () => {
      const values = { qty: null, price: 10 };
      // null is replaced with "undefined" literal in the expression
      const result = evaluateExpression("$values.qty * $values.price", values);
      expect(result).toBeNaN();
    });

    it("handles undefined field values gracefully", () => {
      const values = { price: 10 };
      const result = evaluateExpression("$values.qty * $values.price", values);
      expect(result).toBeNaN();
    });

    it("handles nested field paths", () => {
      const values = {
        parent: { child: 42 },
      };
      expect(evaluateExpression("$values.parent.child", values)).toBe(42);
    });

    it("handles deeply nested field paths", () => {
      const values = {
        a: { b: { c: "deep" } },
      };
      expect(evaluateExpression("$values.a.b.c", values)).toBe("deep");
    });

    it("handles nested path where intermediate is undefined", () => {
      const values = {};
      const result = evaluateExpression("$values.parent.child", values);
      // parent is undefined, so parent.child resolves to undefined
      expect(result).toBeUndefined();
    });

    it("returns undefined for invalid expression (no throw)", () => {
      const values = { a: 1 };
      const result = evaluateExpression("$values.a ++ ++", values);
      expect(result).toBeUndefined();
    });

    it("returns undefined for syntax error expression", () => {
      const values = {};
      expect(evaluateExpression("if (true) {}", values)).toBeUndefined();
    });

    it("evaluates logical operators", () => {
      const values = { a: true, b: false };
      expect(evaluateExpression("$values.a && $values.b", values)).toBe(false);
      expect(evaluateExpression("$values.a || $values.b", values)).toBe(true);
    });

    it("evaluates boolean field values correctly", () => {
      const values = { active: true };
      expect(evaluateExpression("$values.active", values)).toBe(true);
    });

    it("evaluates complex multi-field arithmetic", () => {
      const values = { quantity: 3, unitPrice: 29.99, taxRate: 0.08 };
      const result = evaluateExpression(
        "Math.round($values.quantity * $values.unitPrice * (1 + $values.taxRate) * 100) / 100",
        values
      );
      expect(result).toBe(97.17);
    });
  });

  describe("extractExpressionDependencies", () => {
    it("extracts single field name", () => {
      const deps = extractExpressionDependencies("$values.quantity * 2");
      expect(deps).toEqual(["quantity"]);
    });

    it("extracts multiple field names", () => {
      const deps = extractExpressionDependencies(
        "$values.quantity * $values.unitPrice"
      );
      expect(deps).toContain("quantity");
      expect(deps).toContain("unitPrice");
      expect(deps).toHaveLength(2);
    });

    it("deduplicates repeated field references", () => {
      const deps = extractExpressionDependencies(
        "$values.a + $values.a + $values.b"
      );
      expect(deps).toContain("a");
      expect(deps).toContain("b");
      expect(deps).toHaveLength(2);
    });

    it("returns empty array for expression with no field references", () => {
      const deps = extractExpressionDependencies("1 + 2 + 3");
      expect(deps).toEqual([]);
    });

    it("extracts field names from expressions with Math functions", () => {
      const deps = extractExpressionDependencies(
        "Math.round($values.total * 100) / 100"
      );
      expect(deps).toEqual(["total"]);
    });

    it("extracts field names from string concatenation expressions", () => {
      const deps = extractExpressionDependencies(
        "$values.firstName + ' ' + $values.lastName"
      );
      expect(deps).toContain("firstName");
      expect(deps).toContain("lastName");
      expect(deps).toHaveLength(2);
    });

    it("handles underscored field names", () => {
      const deps = extractExpressionDependencies(
        "$values.field_name + $values._private"
      );
      expect(deps).toContain("field_name");
      expect(deps).toContain("_private");
    });

    it("handles field names with numbers", () => {
      const deps = extractExpressionDependencies("$values.field1 + $values.field2");
      expect(deps).toContain("field1");
      expect(deps).toContain("field2");
    });
  });
});
