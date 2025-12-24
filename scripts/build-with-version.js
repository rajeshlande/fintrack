#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function incrementVersion(version) {
  const parts = version.split('.');
  const patch = parseInt(parts[2]) + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
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
  const newVersion = incrementVersion(currentVersion);
  
  console.log(`📦 Current version: ${currentVersion}`);
  console.log(`📈 New version: ${newVersion}`);
  
  // Update version in files
  updatePackageJson(newVersion);
  updateVersionConfig(newVersion);
  
  // Run build
  runBuild();
  
  console.log(`\n🎉 Build completed with version ${newVersion}`);
  console.log(`📅 Build date: ${new Date().toISOString()}`);
}

main();