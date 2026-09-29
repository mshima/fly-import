import { existsSync } from 'node:fs';
import process from 'node:process';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { defineConfig, getConfig, resetConfig, flyInstall, flyImport, getDefaultRepository, FlyRepository } from '../src/fly-import.js';

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

      // Global bins are linked at the prefix on Windows, and at `<prefix>/../bin` elsewhere.
      const semverBin = process.platform === 'win32' ? join(testRepositoryPath, 'sub/semver.cmd') : join(testRepositoryPath, 'bin/semver');

      it('should not link bins', async () => {
        await flyInstall('semver@7.6.0', { repositoryPath: `${testRepositoryPath}/sub` });
        expect(existsSync(semverBin)).toBe(false);
      });

      it('should link bins when requested', async () => {
        await flyInstall('semver@7.6.0', { repositoryPath: `${testRepositoryPath}/sub`, arboristConfig: { binLinks: true } });
        expect(existsSync(semverBin)).toBe(true);
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

      it('should import a subpath of a package with exports', async () => {
        const { customAlphabet } = await flyImport('nanoid@5.0.9', { subpath: 'non-secure', repositoryPath: `${testRepositoryPath}/sub` });

        expect(customAlphabet('a', 3)()).toBe('aaa');
      });

      it('should import a subpath of a package installed with a custom name', async () => {
        const { customAlphabet } = await flyImport('nanoid5@npm:nanoid@5.0.9', {
          subpath: 'non-secure',
          repositoryPath: `${testRepositoryPath}/sub`,
        });

        expect(customAlphabet('b', 2)()).toBe('bb');
      });

      it('should import a subpath of a package without exports', async () => {
        const { default: satisfies } = await flyImport('semver@7.6.0', {
          subpath: 'functions/satisfies',
          repositoryPath: `${testRepositoryPath}/sub`,
        });

        expect(satisfies('1.2.3', '^1.0.0')).toBe(true);
      });

      it('should import a subpath from the default repository', async () => {
        const { default: satisfies } = await flyImport('semver@7.6.0', { subpath: 'functions/satisfies' });

        expect(satisfies('1.2.3', '^2.0.0')).toBe(false);
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
      describe('install already installed', () => {
        const offlineRepository = () =>
          new FlyRepository({ repositoryPath: `${testRepositoryPath}/sub`, arboristConfig: { registry: 'http://127.0.0.1:9/' } });

        beforeEach(async () => {
          await flyInstall('camelcase@7.0.0', { repositoryPath: `${testRepositoryPath}/sub` });
          await flyInstall('camelcase3@npm:camelcase@7.0.0', { repositoryPath: `${testRepositoryPath}/sub` });
        });

        it('should not reach the registry when versions are satisfied', async () => {
          const repository = offlineRepository();
          const installed = await repository.install(['camelcase@^7.0.0', 'camelcase3@npm:camelcase@7.0.0']);
          expect(installed).toMatchObject([
            { name: 'camelcase', version: '7.0.0' },
            { name: 'camelcase3', packageName: 'camelcase', version: '7.0.0' },
          ]);
          const { default: camelcase } = await repository.import<{ default: (input: string) => string }>('camelcase3@npm:camelcase@7.0.0');
          expect(camelcase('foo-bar')).toBe('fooBar');
        });

        it.each(['camelcase', 'camelcase@latest', 'camelcase@^8.0.0', 'camelcase3@npm:semver@7.0.0'])(
          'should reach the registry for %s',
          async (spec: string) => {
            await expect(offlineRepository().install(spec)).rejects.toThrow();
          },
        );
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
