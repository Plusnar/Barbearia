import { $ } from '../dom.js';
import { state } from '../state.js';

export function getSelectedServiceDuration() {
  const service = state.servicesCache.find(item => item.id === $('serviceSelect')?.value);
  return Number(service?.duration || 0);
}
