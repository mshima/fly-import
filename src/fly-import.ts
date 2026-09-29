import path, { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import envPaths from 'env-paths';
import Arborist from '@npmcli/arborist';
import registryUrl from 'registry-url';
import registryAuthToken from 'registry-auth-token';

// eslint-disable-next-line @typescript-eslint/naming-convention
const { cache: DEFAULT_REPOSITORY_PATH } = envPaths('fly-import');

const defaultConfig: FlyRepositoryConfig = { repositoryPath: DEFAULT_REPOSITORY_PATH };

export type FlyRepositoryConfig = {
  repositoryPath: string;
  arboristConfig?: any;
};

export type FlyImportOptions = Partial<FlyRepositoryConfig> & {
  /**
   * Subpath of the package to import, like `sub/module` of `package/sub/module`.
   * Resolved through the package's `exports` when it declares them.
   */
  subpath?: string;
};

type IntalledPackage = {
  name: string;
  path: string;
  realpath: string;
  pkgid: string;
  version: string;
  packageName: string;
  import: <T = any>(subpath?: string) => Promise<T>;
};

type NotIntalledPackage = {
  name: undefined;
  path: undefined;
  realpath: undefined;
  pkgid: string;
  version: undefined;
  packageName: undefined;
  import: <T = any>(subpath?: string) => Promise<T>;
};

export type FlyResultPackage = NotIntalledPackage | IntalledPackage;

/**
 * @private
 */
export class FlyRepository {
  private readonly arboristConfig: any;
  private _arborist?: Arborist;
  private _repositoryPath!: string;
  private nodeModulesPath!: string;
  private _require?: NodeJS.Require;

  constructor(config: FlyRepositoryConfig) {
    this.repositoryPath = config.repositoryPath;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.arboristConfig = config.arboristConfig;
  }

  get #arborist() {
    if (!this._arborist) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const registry: string = this.arboristConfig?.registry ?? registryUrl();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this._arborist = new Arborist({
        global: true,
        // With global, bins are linked at `<repositoryPath>/../bin`, a folder outside the repository shared with sibling repositories.
        binLinks: false,
        path: this.repositoryPath,
        token: registry ? registryAuthToken(registry) : undefined,
        registry,
        ...this.arboristConfig,
      });
    }

    return this._arborist;
  }

  get #tree() {
    if (!this.#arborist.actualTree) {
      throw new Error('Repository has not been initialized');
    }

    return this.#arborist.actualTree;
  }

  get #require() {
    this._require ??= createRequire(pathToFileURL(join(this.nodeModulesPath)).href);

    return this._require;
  }

  /**
   * Repository absolute path (npm --prefix).
   */
  get repositoryPath(): string {
    return this._repositoryPath;
  }

  private set repositoryPath(repositoryPath) {
    this._repositoryPath = path.resolve(repositoryPath);
    this.nodeModulesPath = path.join(this._repositoryPath, 'node_modules');
    this._require = undefined;
    this._arborist = undefined;
  }

  async load(): Promise<unknown> {
    return this.#arborist.loadActual();
  }

  async install(spec: string): Promise<FlyResultPackage>;
  async install(spec: string[]): Promise<FlyResultPackage[]>;
  async install(spec: string | string[]): Promise<FlyResultPackage[] | FlyResultPackage> {
    const specs = Array.isArray(spec) ? spec : [spec];
    await this.#arborist.reify({ add: specs });
    const installed = this.findSpecs(specs);
    return Array.isArray(spec) ? installed : installed[0];
  }

  async import<T = any>(spec: string, subpath?: string): Promise<T> {
    return this.findSpecs([spec])[0].import<T>(subpath);
  }

  private async resolve(realpath: string, subpath?: string) {
    // Node's import.meta.resolve is experimental and not enabled
    if (!subpath) {
      return pathToFileURL(this.#require.resolve(realpath)).href;
    }

    const packageRequire = createRequire(join(realpath, 'package.json'));
    const { name, exports } = packageRequire('./package.json') as { name: string; exports?: unknown };
    // A package with exports can only be resolved by its own name (self-reference), which applies the exports.
    return pathToFileURL(packageRequire.resolve(exports ? `${name}/${subpath}` : join(realpath, subpath))).href;
  }

  private findSpecs(specs: string[]): FlyResultPackage[] {
    const edgesOut = new Map<string, string>();
    for (const edgeOut of this.#tree.edgesOut) {
      // Type is not correct.
      const edge = (edgeOut as any)[1] as Arborist.Edge;
      if (edge.spec === '*' && specs.includes(edge.name)) {
        edgesOut.set(edge.name, edge.name);
      } else {
        edgesOut.set(`${edge.name}@${edge.spec}`, edge.name);
      }
    }

    return specs.map(spec => {
      const child = edgesOut.get(spec)!;
      const node = this.#tree.children.get(child) as Arborist.Node;
      if (node) {
        const { realpath } = node;
        return {
          name: node.name,
          path: node.path,
          realpath,
          pkgid: node.pkgid,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          version: (node as any).version,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          packageName: (node as any).packageName,
          import: async <T = any>(subpath?: string) => import(await this.resolve(realpath, subpath)) as Promise<T>,
        };
      }

      return {
        pkgid: spec,
        async import() {
          throw new Error(`Could not find installed spec ${spec}`);
        },
      };
    });
  }
}

let defaultRepository = new FlyRepository(defaultConfig);

export const resetConfig = () => {
  Object.assign(defaultConfig, { repositoryPath: DEFAULT_REPOSITORY_PATH, arboristConfig: undefined });
  defaultRepository = new FlyRepository(defaultConfig);
};

export const defineConfig = (config: Partial<FlyRepositoryConfig>) => {
  if (config.repositoryPath) {
    defaultConfig.repositoryPath = config.repositoryPath;
  }

  if (config.arboristConfig) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    defaultConfig.arboristConfig = config.arboristConfig;
  }

  defaultRepository = new FlyRepository(defaultConfig);
};

export const getConfig = (): FlyRepositoryConfig => ({ ...defaultConfig });

export const getDefaultRepository = () => defaultRepository;

export const flyInstall = async (specifier: string, options?: FlyRepositoryConfig) => {
  let repo = defaultRepository;
  if (options) {
    repo = new FlyRepository({ ...defaultConfig, ...options });
  }

  return repo.install(specifier);
};

export const flyImport = async <T = any>(specifier: string, options?: FlyImportOptions): Promise<T> => {
  const { subpath, ...repositoryConfig } = options ?? {};
  let repo = defaultRepository;
  if (Object.keys(repositoryConfig).length > 0) {
    repo = new FlyRepository({ ...defaultConfig, ...repositoryConfig });
  }

  await repo.install(specifier);
  return repo.import<T>(specifier, subpath);
};
