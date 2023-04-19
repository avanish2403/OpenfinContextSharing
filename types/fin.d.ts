import type { fin as FinApi } from '@openfin/core';

declare global {
  let fin = window.fin;
  interface Window {
    fin: typeof FinApi;
  }
}
