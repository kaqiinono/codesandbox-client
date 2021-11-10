import delay from '@codesandbox/common/lib/utils/delay';
import { getPrivateDependencyServerUrl } from '@codesandbox/common/lib/utils/dependencies';

function isPrivateDependency(name: string) {
  return /\/@jd\/.*/.test(name);
}

function getPrivateDependencyInfo(url: string) {
  let info = url.split('@jd/')[1].split('/');
  if (info && info[0] && info[0].indexOf('@') > -1) {
    info = info[0].split('@');
    return getPrivateDependencyServerUrl(`@jd/${info[0]}`, info[1]);
  }
  if (info && info.length > 1) {
    // @ts-ignore
    const version = info && info.pop().replace('.json', '');
    const depName = `@jd/${info.join('/')}`;
    return getPrivateDependencyServerUrl(depName, version);
  }
  console.warn('dependency get wrong', url, info);
  return url;
}

export async function fetchWithRetries(
  url: string,
  retries = 6,
  requestInit?: RequestInit
): Promise<Response> {
  // eslint-disable-next-line no-console
  console.log('fetchWithRetries', url);
  const doFetch = () => {
    let _url = url;
    if (isPrivateDependency(_url)) {
      _url = getPrivateDependencyInfo(_url);
    }
    window.fetch(_url, requestInit).then(x => {
      if (x.ok) {
        return x;
      }

      const error: Error & {
        responseObject?: Response;
      } = new Error(`Could not fetch ${url}`);

      error.responseObject = x;

      throw error;
    });
  };

  let lastTryTime = 0;
  for (let i = 0; i < retries; i++) {
    if (Date.now() - lastTryTime < 3000) {
      // Ensure that we at least wait 3s before retrying a request to prevent rate limits
      // eslint-disable-next-line
      await delay(3000 - (Date.now() - lastTryTime));
    }
    try {
      lastTryTime = Date.now();
      // @ts-ignore
      // eslint-disable-next-line no-await-in-loop
      return await doFetch();
    } catch (e) {
      console.error(e);
      if (i === retries - 1) {
        throw e;
      }
    }
  }

  throw new Error('Could not fetch');
}
