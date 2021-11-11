import { valid } from 'semver';

export const isPrivateDependency = (pkgName: string) =>
  /^(@jd)\/.*/.test(pkgName);
export const getPrivateDependencyServerUrl = (name, version) =>
  `http://coder.jd.com/api/dependency?name=${name}&version=${version}`;
export const getPrivateDependencyInfoUrl = name =>
  `https://registry.m.jd.com/${name}`;

export async function getPrivateDependencyInfo(name, version) {
  const privateUrl = getPrivateDependencyInfoUrl(name);

  // eslint-disable-next-line no-return-await
  return await fetch(privateUrl)
    .then(x => {
      if (x.ok) {
        return x.json();
      }
      throw new Error('Could not fetch ' + privateUrl);
    })
    .then((data: any) => {
      if (data.versions && data.versions[version]) {
        return data.versions[version];
      }
      if (
        data['dist-tags'] &&
        data['dist-tags'].latest &&
        data.versions[data['dist-tags'].latest]
      ) {
        return data.versions[data['dist-tags'].latest];
      }
      throw new Error('Could not fetch ' + privateUrl + ', version:' + version);
    });
}

async function fetchWithRetries(
  url: string,
  obj: { dep: string; version: string }
) {
  console.warn('fetchWithRetries', url);
  let err: Error;
  for (let i = 0; i < 5; i++) {
    try {
      if (obj && isPrivateDependency(obj.dep)) {
        // eslint-disable-next-line
        return await getPrivateDependencyInfo(obj.dep, obj.version);
      }
      // eslint-disable-next-line
      return await fetch(url).then(x => {
        if (x.ok) {
          return x.json();
        }

        throw new Error('Could not fetch ' + url);
      });
    } catch (e) {
      err = e;
    }
  }

  throw err;
}

export async function fetchPackageJSON(dep: string, version: string) {
  const fetchJsdelivr = () =>
    fetchWithRetries(
      `https://cdn.jsdelivr.net/npm/${dep}@${encodeURIComponent(
        version
      )}/package.json`,
      {
        dep,
        version,
      }
    );
  const fetchUnpkg = () =>
    fetchWithRetries(
      `https://unpkg.com/${dep}@${encodeURIComponent(version)}/package.json`,
      {
        dep,
        version,
      }
    );

  if (isAbsoluteVersion(version)) {
    try {
      return await fetchJsdelivr();
    } catch (e) {
      return fetchUnpkg();
    }
  } else {
    // If it is not an absolute version (e.g. a tag like `next`), we don't want to fetch
    // using JSDelivr, because JSDelivr caches the response for a long time. Because of this,
    // when a tag updates to a new version, people won't see that update for a long time.
    // Unpkg does handle this nicely, but is less stable. So we default to JSDelivr, but
    // for tags we use unpkg.
    try {
      return await fetchUnpkg();
    } catch (e) {
      return fetchJsdelivr();
    }
  }
}

export function isAbsoluteVersion(version: string) {
  const isAbsolute = /^\d+\.\d+\.\d+$/.test(version);

  return isAbsolute || /\//.test(version);
}

export function isValidSemver(version: string) {
  return Boolean(valid(version));
}

export async function getAbsoluteDependency(
  depName: string,
  depVersion: string
): Promise<{ name: string; version: string }> {
  if (isAbsoluteVersion(depVersion)) {
    return { name: depName, version: depVersion };
  }

  let data;
  if (depName === 'cerebral' && depVersion === 'latest') {
    // Bug in JSDelivr, this returns the wrong package.json (of a beta version). So use Unpkg
    data = await fetchWithRetries(
      `https://unpkg.com/cerebral@${encodeURIComponent('latest')}/package.json`,
      null
    );
  } else {
    data = await fetchPackageJSON(depName, depVersion);
  }

  return { name: depName, version: data.version };
}

export async function getAbsoluteDependencies(dependencies: {
  [dep: string]: string;
}) {
  const nonAbsoluteDependencies = Object.keys(dependencies).filter(
    dep => !isAbsoluteVersion(dependencies[dep])
  );

  const newDependencies = { ...dependencies };

  await Promise.all(
    nonAbsoluteDependencies.map(async dep => {
      try {
        const { version } = await getAbsoluteDependency(
          dep,
          newDependencies[dep]
        );

        newDependencies[dep] = version;
      } catch (e) {
        /* ignore */
      }
    })
  );

  return newDependencies;
}

// 基于样式文件内容创建 style 标签，并插入到 head 标签上
const insertStyleNode = (content: string) => {
  const styleNode = document.createElement('style');
  styleNode.type = 'text/css';
  styleNode.innerHTML = content;
  document.head.appendChild(styleNode);
};

export const insertBuiltinComponentStyle = (manifest: any) => {
  const { contents, dependencies, dependencyDependencies } = manifest;
  // 从依赖以及依赖的依赖中根据 npm 包名筛选出内建组件
  const builtinComponents = Object.keys(
    dependencyDependencies
  ).filter(pkgName => isPrivateDependency(pkgName));
  dependencies.forEach((d: any) => {
    if (isPrivateDependency(d.name)) {
      builtinComponents.push(d.name);
    }
  });
  // 根据基于内建组件 npm 名称拼装成的 key 查找到具体的文件内容，并调用 insertStyleNode 方法插入到 head 标签上
  builtinComponents.forEach(name => {
    const styleContent = contents[`/node_modules/${name}/dist/index.css`];
    if (styleContent) {
      const { content } = styleContent;
      if (content) {
        insertStyleNode(content);
      }
    }
  });
};
