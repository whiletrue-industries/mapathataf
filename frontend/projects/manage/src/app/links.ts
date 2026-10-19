import { Workspace } from './api.service';

export function adminLink(workspace: Workspace): string | null {
  if (!workspace.key) {
    return null;
  }
  return `https://admin.tafmap.org.il/${workspace.id}?key=${workspace.key}`;
}

export function appLink(workspace: Workspace): string {
  return `https://app.tafmap.org.il/${workspace.id}`;
}

// The app shows the onboarding when `?onboarding` is present and the URL has no hash
export function appOnboardingLink(workspace: Workspace): string {
  return `${appLink(workspace)}?onboarding`;
}
