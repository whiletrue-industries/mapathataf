import { Workspace } from './api.service';
import { adminLink, appLink } from './links';

describe('copy links', () => {
  const workspace: Workspace = {id: 'dymonh', key: 'secret-key', favorite: false, active: true, metadata: {}};

  it('builds the admin link with the workspace key', () => {
    expect(adminLink(workspace)).toEqual('https://admin.tafmap.org.il/dymonh?key=secret-key');
  });

  it('returns no admin link without a key', () => {
    expect(adminLink({...workspace, key: undefined})).toBeNull();
  });

  it('builds the app link', () => {
    expect(appLink(workspace)).toEqual('https://app.tafmap.org.il/dymonh');
  });
});
