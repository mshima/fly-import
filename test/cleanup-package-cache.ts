//
//    * Remove the package from node's cache, necessary for a reinstallation.
//    * Removes only package.json by default, it's used to version verification.
//    * Removes only cache of the repository's packages.
//    * @param packageName - Package name.
//    * @param force - If true removes every cache the package.
//    * @throw Error if force === false and any file other the package.json is loaded.
//   cleanupPackageCache(specifier: string, force = false) {
//     if (!specifier) {
//       throw new Error('You must provide a specifier');
//     }
//
//     debug('Cleaning cache of %s', specifier);
//     const packagePath = this.resolve(specifier);
//     const toCleanup = Object.keys(require.cache).filter(cache => cache.startsWith(packagePath));
//     if (!force && toCleanup.some(cache => !cache.endsWith('package.json'))) {
//       throw new Error(`Package ${specifier} already loaded`);
//     }
//
//     for (const cache of toCleanup) {
//       // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//       delete require.cache[cache];
//     }
//   }
