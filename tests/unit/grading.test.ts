// Deterministic grading of bank questions, against the bank's own answer keys.
import assert from "node:assert/strict";
import { test } from "node:test";
import { QUESTION_BANK } from "../../src/content/curriculum/question-bank";
import { gradeChoice, gradeOrder, isGradable } from "../../src/lib/course/grading";

test("every bank question is gradable deterministically", () => {
  assert.ok(QUESTION_BANK.every(isGradable));
});

test("choice: only the keyed option is correct; wrong options return their own feedback", () => {
  for (const q of QUESTION_BANK.filter((x) => x.kind === "choice")) {
    for (const o of q.options!) {
      const g = gradeChoice(q, o.id);
      assert.equal(g.correct, o.id === q.correct, `${q.id}/${o.id}`);
      assert.deepEqual(g.feedback, g.correct ? [q.explanation] : [o.why ?? g.feedback[0]]);
      assert.ok(g.feedback[0].length > 0);
    }
    assert.throws(() => gradeChoice(q, "no-such-option"));
  }
});

test("order: the listed order is correct, the initial shuffle is not; positions are reported", () => {
  for (const q of QUESTION_BANK.filter((x) => x.kind === "order")) {
    const key = q.items!.map((i) => i.id);
    assert.deepEqual(gradeOrder(q, key), { correct: true, wrongPositions: [], feedback: [q.explanation] });
    const g = gradeOrder(q, q.initial!);
    assert.equal(g.correct, false);
    assert.deepEqual(g.wrongPositions, q.initial!.map((id, i) => (id === key[i] ? -1 : i)).filter((i) => i >= 0));
    assert.throws(() => gradeOrder(q, key.slice(1)));
  }
});
