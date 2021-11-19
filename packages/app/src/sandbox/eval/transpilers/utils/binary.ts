import { Module } from 'sandpack-core/lib/types/module';
import { getApiPrefix } from '@codesandbox/common/lib/utils/host';

export function getModuleHTTPPath(module: Module, sandboxId: string | null) {
  if (!sandboxId) {
    return module.path;
  }

  return `${getApiPrefix}/${sandboxId}/fs${module.path}`;
}
