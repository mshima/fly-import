import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  defineConfig,
  getConfig,
  resetConfig,
  flyInstall,
  flyImport,
  getDefaultRepository,
  type FlyRepository,
} from '../src/fly-import.js';

const testRepositoryPath = join(fileURLToPath(import.meta.url), '../repository');

describe('fly-import', () => {
  describe('defineConfig', () => {
    it('should set defaultConfig and reset', () => {
      expect(getConfig().arboristConfig).toBeUndefined();
      const defaultRepositoryPath = getConfig().repositoryPath;
      expect(defaultRepositoryPath).toBeDefined();

      defineConfig({ repositoryPath: 'foo', arboristConfig: { registry: 'bar' } });

      expect(getConfig().arboristConfig).toMatchObject({ registry: 'bar' });
      expect(getConfig().repositoryPath).toBe('foo');

      resetConfig();

      expect(getConfig().arboristConfig).toBeUndefined();
      expect(defaultRepositoryPath).toBe(defaultRepositoryPath);
    });
  });

  describe('implementation', () => {
    beforeEach(() => {
      defineConfig({ repositoryPath: testRepositoryPath });
    });
    beforeEach(async () => {
      resetConfig();
    });
    afterEach(async () => {
      try {
        await rm(testRepositoryPath, { recursive: true });
      } catch {}
    });

    describe('install', () => {
      it('should install package', async () => {
        const installed = await flyInstall('camelcase');
        expect(installed).toMatchObject({
          packageName: 'camelcase',
          path: /camelcase$/,
          realpath: /camelcase$/,
        });
      });

      it('should install package using custom package name', async () => {
        const installed = await flyInstall('camelcase3@npm:camelcase@7.0.0');
        expect(installed).toMatchObject({
          name: 'camelcase3',
          packageName: 'camelcase',
          version: '7.0.0',
          pkgid: 'camelcase3@npm:camelcase@7.0.0',
          path: /camelcase3$/,
          realpath: /camelcase3$/,
        });
      });

      it('should install package passing options', async () => {
        const installed = await flyInstall('camelcase3@npm:camelcase@7.0.0', { repositoryPath: `${testRepositoryPath}/sub` });
        expect(installed).toMatchObject({
          name: 'camelcase3',
          packageName: 'camelcase',
          version: '7.0.0',
          pkgid: 'camelcase3@npm:camelcase@7.0.0',
          path: /camelcase3$/,
          realpath: /camelcase3$/,
        });
      });

      it('should not link bins outside the repository', async () => {
        await flyInstall('semver@7.6.0', { repositoryPath: `${testRepositoryPath}/sub` });
        expect(existsSync(join(testRepositoryPath, 'bin/semver'))).toBe(false);
      });

      it('should link bins when requested', async () => {
        await flyInstall('semver@7.6.0', { repositoryPath: `${testRepositoryPath}/sub`, arboristConfig: { binLinks: true } });
        expect(existsSync(join(testRepositoryPath, 'bin/semver'))).toBe(true);
      });

      it('should fail to install not existing package', async () => {
        await expect(flyInstall('camelcase3@npm:camelcase@20.0.0')).rejects.toThrowError(/No matching version found for/);
      });
    });

    describe('flyImport', () => {
      it('should import package', async () => {
        const { default: camelcase } = await flyImport('camelcase3@npm:camelcase@7.0.0');

        expect(camelcase('foo-bar')).toBe('fooBar');
      });

      it('should import package passing options', async () => {
        const { default: camelcase } = await flyImport('camelcase3@npm:camelcase@7.0.0', { repositoryPath: `${testRepositoryPath}/sub` });

        expect(camelcase('foo-bar')).toBe('fooBar');
      });
    });

    describe('repository', () => {
      let repository: FlyRepository;
      beforeEach(() => {
        repository = getDefaultRepository();
      });

      describe('install', () => {
        it('should install array', async () => {
          const installed = await repository.install(['camelcase@7.0.0', 'camelcase3@npm:camelcase@7.0.0']);
          expect(installed).toMatchObject([
            {
              name: 'camelcase',
              packageName: 'camelcase',
              version: '7.0.0',
              pkgid: 'camelcase@7.0.0',
              path: /camelcase$/,
              realpath: /camelcase$/,
            },
            {
              name: 'camelcase3',
              packageName: 'camelcase',
              version: '7.0.0',
              pkgid: 'camelcase3@npm:camelcase@7.0.0',
              path: /camelcase3$/,
              realpath: /camelcase3$/,
            },
          ]);
        });
      });
      describe('import', () => {
        it('importing on a non initialized repository should throw', async () => {
          await expect(repository.import('non-existing')).rejects.toThrowError('Repository has not been initialized');
        });
        it('importing a non existing module should fail', async () => {
          await repository.load();
          await expect(repository.import('non-existing')).rejects.toThrowError('Could not find installed spec non-existing');
        });
      });
    });
  });
});
