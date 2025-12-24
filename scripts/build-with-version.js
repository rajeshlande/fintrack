#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function getBumpType() {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    const commits = execSync(`git log --oneline ${lastTag}..HEAD`, { encoding: 'utf8' });
    const lines = commits.split('\n').filter(line => line.trim());
    let hasBreaking = false;
    let hasFeature = false;
    let hasFix = false;
    for (const line of lines) {
      const message = line.split(' ').slice(1).join(' '); // remove commit hash
      if (message.includes('BREAKING CHANGE') || message.includes('!')) {
        hasBreaking = true;
      }
      if (message.startsWith('feat:')) {
        hasFeature = true;
      }
      if (message.startsWith('fix:')) {
        hasFix = true;
      }
    }
    if (hasBreaking) return 'major';
    if (hasFeature) return 'minor';
    if (hasFix) return 'patch';
    return 'patch'; // default if no conventional commits
  } catch (error) {
    // if no tags or git error, default to patch
    console.log('⚠️ Could not determine bump type from git, defaulting to patch');
    return 'patch';
  }
}

function getChangelogEntries() {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    const commits = execSync(`git log --oneline ${lastTag}..HEAD`, { encoding: 'utf8' });
    const lines = commits.split('\n').filter(line => line.trim());
    const entries = { added: [], changed: [], fixed: [], removed: [], security: [] };
    for (const line of lines) {
      const message = line.split(' ').slice(1).join(' '); // remove commit hash
      if (message.startsWith('feat:')) {
        entries.added.push(message.substring(5).trim());
      } else if (message.startsWith('fix:')) {
        entries.fixed.push(message.substring(4).trim());
      } else if (message.startsWith('refactor:') || message.startsWith('perf:') || message.startsWith('style:') || message.startsWith('test:')) {
        entries.changed.push(message.split(':')[1].trim());
      } else if (message.startsWith('docs:') || message.startsWith('chore:')) {
        // Skip docs and chore for changelog
      } else if (message.includes('BREAKING CHANGE')) {
        entries.changed.push(message.replace('BREAKING CHANGE', '').trim());
      } else {
        entries.changed.push(message);
      }
    }
    return entries;
  } catch (error) {
    console.log('⚠️ Could not get changelog entries from git');
    return { added: [], changed: [], fixed: [], removed: [], security: [] };
  }
}

function incrementVersion(version, bumpType) {
  const parts = version.split('.');
  let major = parseInt(parts[0]);
  let minor = parseInt(parts[1]);
  let patch = parseInt(parts[2]);
  if (bumpType === 'major') {
    major++;
    minor = 0;
    patch = 0;
  } else if (bumpType === 'minor') {
    minor++;
    patch = 0;
  } else {
    patch++;
  }
  return `${major}.${minor}.${patch}`;
}

function updatePackageJson(newVersion) {
  const packagePath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const oldVersion = packageJson.version;
  packageJson.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Updated package.json: ${oldVersion} → ${newVersion}`);
}

function updateVersionConfig(newVersion) {
  const versionPath = join(rootDir, 'src', 'config', 'version.ts');
  let versionContent = readFileSync(versionPath, 'utf8');
  const oldVersionMatch = versionContent.match(/version:\s*['"]([^'"]+)['"]/);
  if (oldVersionMatch) {
    versionContent = versionContent.replace(
      /version:\s*['"][^'"]+['"]/,
      `version: '${newVersion}'`
    );
    writeFileSync(versionPath, versionContent);
    console.log(`✅ Updated version.ts: ${oldVersionMatch[1]} → ${newVersion}`);
  }
}

function updateChangelog(newVersion, entries) {
  const changelogPath = join(rootDir, 'CHANGELOG.md');
  let changelogContent = readFileSync(changelogPath, 'utf8');

  // Get current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Create new version section
  let newSection = `## [${newVersion}] - ${today}\n\n`;

  if (entries.added.length > 0) {
    newSection += '### Added\n';
    entries.added.forEach(entry => {
      newSection += `- ${entry}\n`;
    });
    newSection += '\n';
  }

  if (entries.changed.length > 0) {
    newSection += '### Changed\n';
    entries.changed.forEach(entry => {
      newSection += `- ${entry}\n`;
    });
    newSection += '\n';
  }

  if (entries.fixed.length > 0) {
    newSection += '### Fixed\n';
    entries.fixed.forEach(entry => {
      newSection += `- ${entry}\n`;
    });
    newSection += '\n';
  }

  if (entries.removed.length > 0) {
    newSection += '### Removed\n';
    entries.removed.forEach(entry => {
      newSection += `- ${entry}\n`;
    });
    newSection += '\n';
  }

  if (entries.security.length > 0) {
    newSection += '### Security\n';
    entries.security.forEach(entry => {
      newSection += `- ${entry}\n`;
    });
    newSection += '\n';
  }

  // Replace [Unreleased] section with new version section
  const unreleasedPattern = /## \[Unreleased\]\n\n([\s\S]*?)(?=\n## \[|$)/;
  const unreleasedMatch = changelogContent.match(unreleasedPattern);

  if (unreleasedMatch) {
    // Move unreleased content to new version
    const unreleasedContent = unreleasedMatch[1].trim();
    if (unreleasedContent) {
      newSection += unreleasedContent + '\n\n';
    }
    changelogContent = changelogContent.replace(unreleasedPattern, newSection);
  } else {
    // If no unreleased section, just add new section after header
    const headerPattern = /# Changelog\n\n([\s\S]*?)\n## /;
    changelogContent = changelogContent.replace(headerPattern, `# Changelog\n\nAll notable changes to FinTrack will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n${newSection}## `);
  }

  writeFileSync(changelogPath, changelogContent);
  console.log(`✅ Updated CHANGELOG.md with version ${newVersion}`);
}

function runBuild() {
  console.log('🔨 Running Vite build...');
  try {
    execSync('npm run build:static', { stdio: 'inherit', cwd: rootDir });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

function main() {
  console.log('🚀 Starting build with version increment...');

  // Read current version
  const packagePath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;
  const bumpType = getBumpType();
  const newVersion = incrementVersion(currentVersion, bumpType);

  console.log(`📦 Current version: ${currentVersion}`);
  console.log(`📈 Bump type: ${bumpType}`);
  console.log(`📈 New version: ${newVersion}`);

  // Get changelog entries from git commits
  const changelogEntries = getChangelogEntries();

  // Update changelog first
  updateChangelog(newVersion, changelogEntries);

  // Update version in files
  updatePackageJson(newVersion);
  updateVersionConfig(newVersion);

  // Run build
  runBuild();

  console.log(`\n🎉 Build completed with version ${newVersion}`);
  console.log(`📅 Build date: ${new Date().toISOString()}`);
}

main();