import { expect, test } from 'bun:test';
import { linearTimingGuidance } from './linearTiming';

test('linear timing guidance follows the workbook evidence and conflict precedence', () => {
    expect(linearTimingGuidance({ standard: 10, advance: 0, delay: 0 })).toBe(
        'Standard time to target condition applied',
    );
    expect(linearTimingGuidance({ standard: 10, advance: 2, delay: 0 })).toBe(
        'Check details - Is there evidence habitat creation started/in place? ⚠',
    );
    expect(linearTimingGuidance({ standard: 10, advance: 10, delay: 0 })).toBe(
        'Check details - Is there evidence that habitat has reached target condition? ⚠',
    );
    expect(linearTimingGuidance({ standard: 10, advance: 0, delay: 2 })).toBe(
        'Check details- Delay in starting habitat in required condition? ⚠',
    );
    expect(linearTimingGuidance({ standard: 10, advance: 2, delay: 2 })).toBe(
        'Error -both advance and delayed habitat creation ▲',
    );
    expect(linearTimingGuidance({ standard: 10, advance: '30+', delay: 2 })).toBe(
        'Error -both advance and delayed habitat creation ▲',
    );
    expect(linearTimingGuidance({ standard: '30+', advance: 0, delay: 0 })).toBe(
        'Standard time to target condition applied',
    );
});
