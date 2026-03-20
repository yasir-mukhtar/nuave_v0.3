export function clearNuaveProjectSession() {
  const keysToRemove = [
    'nuave_new_project',
    'nuave_new_project_topics',
    'nuave_new_project_prompts',
    'nuave_audit_result',
  ];
  keysToRemove.forEach(key => sessionStorage.removeItem(key));

  // Clear all cached topics/prompts keys
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith('nuave_cached_topics_') || key.startsWith('nuave_cached_prompts_'))) {
      sessionStorage.removeItem(key);
    }
  }
}
