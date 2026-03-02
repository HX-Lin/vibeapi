import React, { lazy, Suspense } from 'react';

const MarkdownRenderer = lazy(() => import('./MarkdownRenderer'));

export default function LazyMarkdownRenderer(props) {
  return (
    <Suspense fallback={<div style={{ padding: '16px' }}>Loading...</div>}>
      <MarkdownRenderer {...props} />
    </Suspense>
  );
}
