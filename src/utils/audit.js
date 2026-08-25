let activityCounter = 100;

export function createActivityEntry({
  type,
  message,
  actor = 'Clinic Manager',
  metadata = {},
}) {
  activityCounter += 1;
  return {
    id: `ACT-${String(activityCounter).padStart(3, '0')}`,
    type,
    actor,
    timestamp: new Date().toISOString(),
    message,
    metadata,
  };
}

export function prependActivity(activity, entry) {
  return [entry, ...activity];
}
