/**
 * Tests for web/personas-open-source/package.json
 *
 * Validates the next dependency version bump from 15.0.3 to 15.0.7,
 * which was a security-fix release (CVE remediation).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_PATH = join(__dirname, '..', 'package.json');

// Parse once; individual tests assert on the result.
let pkg;
try {
  pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
} catch (err) {
  throw new Error(`Failed to parse package.json: ${err.message}`);
}

describe('package.json – next dependency version (security bump)', () => {
  it('package.json is valid JSON and parses without error', () => {
    assert.ok(pkg !== null && typeof pkg === 'object', 'parsed value should be an object');
  });

  it('next is listed under dependencies (not devDependencies)', () => {
    assert.ok(
      Object.prototype.hasOwnProperty.call(pkg.dependencies ?? {}, 'next'),
      '"next" should be present in dependencies'
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(pkg.devDependencies ?? {}, 'next'),
      false,
      '"next" must not appear in devDependencies'
    );
  });

  it('next version is exactly "15.0.7" (the patched release)', () => {
    assert.equal(
      pkg.dependencies.next,
      '15.0.7',
      `Expected next@15.0.7 but found next@${pkg.dependencies.next}`
    );
  });

  it('next version is NOT the previously vulnerable version "15.0.3" (regression)', () => {
    assert.notEqual(
      pkg.dependencies.next,
      '15.0.3',
      'next must not be pinned to the vulnerable version 15.0.3'
    );
  });

  it('next major version is 15 (no accidental major-version downgrade)', () => {
    const raw = pkg.dependencies.next;
    // Strip leading semver range characters (^, ~, >=, etc.)
    const bare = raw.replace(/^[\^~>=<]+/, '');
    const [major] = bare.split('.');
    assert.equal(Number(major), 15, `Expected major version 15, got ${major}`);
  });

  it('next minor version is 0 and patch is >= 7 (meets security baseline)', () => {
    const raw = pkg.dependencies.next;
    const bare = raw.replace(/^[\^~>=<]+/, '');
    const parts = bare.split('.').map(Number);
    const [major, minor, patch] = parts;

    assert.equal(major, 15, 'major must be 15');
    assert.equal(minor, 0, 'minor must be 0');
    assert.ok(patch >= 7, `patch ${patch} must be >= 7 (15.0.7 is the minimum secure release)`);
  });

  it('package.json contains all expected top-level keys', () => {
    const required = ['name', 'version', 'scripts', 'dependencies', 'devDependencies'];
    for (const key of required) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(pkg, key),
        `package.json is missing required key: "${key}"`
      );
    }
  });

  it('react and react-dom versions are unchanged alongside the next bump', () => {
    // Ensure the bump did not accidentally alter the peer-dependency versions.
    assert.equal(pkg.dependencies.react, '19.1.0', 'react version should remain 19.1.0');
    assert.equal(pkg.dependencies['react-dom'], '19.1.0', 'react-dom version should remain 19.1.0');
  });
});
