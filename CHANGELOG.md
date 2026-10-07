# Changelog

## [2.1.1](https://github.com/mshima/fly-import/compare/v2.1.0...v2.1.1) (2026-10-07)


### Performance Improvements

* import arborist at the first use of a repository ([#33](https://github.com/mshima/fly-import/issues/33)) ([fbde723](https://github.com/mshima/fly-import/commit/fbde723e09229a5054aa027b0b0da91561b1a8bf))

## [2.1.0](https://github.com/mshima/fly-import/compare/v2.0.0...v2.1.0) (2026-10-05)


### Features

* abort an install with a signal ([#31](https://github.com/mshima/fly-import/issues/31)) ([6198309](https://github.com/mshima/fly-import/commit/6198309ca0050c72ee3cb7dadb33226ec3ba6916))

## [2.0.0](https://github.com/mshima/fly-import/compare/v1.2.0...v2.0.0) (2026-10-02)


### ⚠ BREAKING CHANGES

* Node.js 20 and Node.js 22 before 22.22.2 are no longer supported.

### Features

* require Node.js 22.22.2, 24.15.0 or 26, with @npmcli/arborist 10 and npm-package-arg 14 ([#23](https://github.com/mshima/fly-import/issues/23)) ([00b1abf](https://github.com/mshima/fly-import/commit/00b1abf6985a9e4b5f72f14bd0687d13f2b25ce6))

## [1.2.0](https://github.com/mshima/fly-import/compare/v1.1.1...v1.2.0) (2026-10-02)


### Features

* **deps:** bump env-paths from 3.0.0 to 4.0.0 ([#17](https://github.com/mshima/fly-import/issues/17)) ([713eec2](https://github.com/mshima/fly-import/commit/713eec27bca9f9ff9a06c95b18d041858b78f5cd))
* **deps:** bump npm-package-arg from 12.0.2 to 13.0.2 ([#18](https://github.com/mshima/fly-import/issues/18)) ([175f6ea](https://github.com/mshima/fly-import/commit/175f6ea4b9edbb3d81cc60c0f6c904c0bcd2b6ef))

## [1.1.1](https://github.com/mshima/fly-import/compare/v1.1.0...v1.1.1) (2026-09-29)


### Bug Fixes

* add repository and package metadata to package.json ([#7](https://github.com/mshima/fly-import/issues/7)) ([13ed012](https://github.com/mshima/fly-import/commit/13ed012639c30304c8118543feac136e9a05d01c))

## [1.1.0](https://github.com/mshima/fly-import/compare/v1.0.0...v1.1.0) (2026-09-29)


### Features

* support importing a package subpath, skip reify when installed, stop linking bins outside the repository ([#4](https://github.com/mshima/fly-import/issues/4)) ([791e10b](https://github.com/mshima/fly-import/commit/791e10b03d5978618d42dc5b36fec7f5a2c84b82))
